// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

const WINDOW_ICON: tauri::image::Image<'_> = tauri::include_image!("./icons/32x32.png");

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();
            _window.set_icon(WINDOW_ICON)?;

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
