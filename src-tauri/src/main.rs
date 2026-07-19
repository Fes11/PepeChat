// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Position, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

const WINDOW_ICON: tauri::image::Image<'_> = tauri::include_image!("./icons/32x32.png");
const TRAY_MENU_WIDTH: f64 = 220.0;
const TRAY_MENU_HEIGHT: f64 = 172.0;

fn show_main_window_inner(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()?;
        window.unminimize()?;
        window.set_focus()?;
    }

    if let Some(menu) = app.get_webview_window("tray-menu") {
        menu.hide()?;
    }

    Ok(())
}

fn hide_tray_menu_inner(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(menu) = app.get_webview_window("tray-menu") {
        menu.hide()?;
    }

    Ok(())
}

fn toggle_tray_menu(app: &tauri::AppHandle, click_position: PhysicalPosition<f64>) {
    let Some(menu) = app.get_webview_window("tray-menu") else {
        return;
    };

    if menu.is_visible().unwrap_or(false) {
        let _ = menu.hide();
        return;
    }

    let scale_factor = menu.scale_factor().unwrap_or(1.0);
    let width = (TRAY_MENU_WIDTH * scale_factor) as i32;
    let height = (TRAY_MENU_HEIGHT * scale_factor) as i32;
    let mut x = click_position.x as i32 - width + 24;
    let mut y = click_position.y as i32 - height - 16;

    if let Ok(Some(monitor)) = menu.current_monitor().or_else(|_| menu.primary_monitor()) {
        let monitor_pos = monitor.position();
        let monitor_size = monitor.size();
        let min_x = monitor_pos.x;
        let min_y = monitor_pos.y;
        let max_x = monitor_pos.x + monitor_size.width as i32 - width;
        let max_y = monitor_pos.y + monitor_size.height as i32 - height;

        x = x.clamp(min_x, max_x);
        if y < min_y {
            y = (click_position.y as i32 + 16).clamp(min_y, max_y);
        } else {
            y = y.clamp(min_y, max_y);
        }
    }

    let _ = menu.set_position(Position::Physical(PhysicalPosition::new(x, y)));
    let _ = menu.show();
    let _ = menu.set_focus();
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    show_main_window_inner(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_tray_menu(app: tauri::AppHandle) -> Result<(), String> {
    hide_tray_menu_inner(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn quit_from_tray(app: tauri::AppHandle) {
    app.exit(0);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_main_window_inner(app);
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_tray_menu,
            quit_from_tray
        ])
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();
            _window.set_icon(WINDOW_ICON)?;
            let main_window = _window.clone();
            _window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = main_window.hide();
                }
            });

            let tray_menu = WebviewWindowBuilder::new(
                app,
                "tray-menu",
                WebviewUrl::App("index.html?tray=menu".into()),
            )
            .title("PepeChat")
            .inner_size(TRAY_MENU_WIDTH, TRAY_MENU_HEIGHT)
            .min_inner_size(TRAY_MENU_WIDTH, TRAY_MENU_HEIGHT)
            .max_inner_size(TRAY_MENU_WIDTH, TRAY_MENU_HEIGHT)
            .resizable(false)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .transparent(true)
            .visible(false)
            .build()?;

            tray_menu.set_icon(WINDOW_ICON)?;
            let tray_menu_window = tray_menu.clone();
            tray_menu.on_window_event(move |event| match event {
                WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = tray_menu_window.hide();
                }
                WindowEvent::Focused(false) => {
                    let _ = tray_menu_window.hide();
                }
                _ => {}
            });

            TrayIconBuilder::with_id("pepechat-tray")
                .icon(WINDOW_ICON)
                .tooltip("PepeChat")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        position,
                        button,
                        button_state,
                        ..
                    } if matches!(button, MouseButton::Left | MouseButton::Right)
                        && button_state == MouseButtonState::Up =>
                    {
                        toggle_tray_menu(tray.app_handle(), position);
                    }
                    TrayIconEvent::DoubleClick { .. } => {
                        let _ = show_main_window_inner(tray.app_handle());
                    }
                    _ => {}
                })
                .build(app)?;

            #[cfg(target_os = "macos")]
            {
                apply_vibrancy(
                    &_window,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::Active),
                    None,
                )
                .expect("Failed to apply vibrancy");
            }

            #[cfg(target_os = "windows")]
            {
                // Один из трёх вариантов (можешь выбрать любой):

                // 💎 Acrylic (полупрозрачный blur)
                // window_vibrancy::apply_acrylic(&_window, Some((0, 0, 0, 90))) // RGBA цвет подложки
                //     .expect("Failed to apply acrylic");

                // 🌫️ или Mica (матовый эффект, как в Win11)
                // window_vibrancy::apply_mica(&_window, Some(true)).expect("Failed to apply mica");

                // 🪟 или Tabbed (вариант Mica для вкладок)
                // window_vibrancy::apply_tabbed(&_window, Some(true)).expect("Failed to apply tabbed");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
