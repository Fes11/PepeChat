// // Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// fn main() {
//     tauri_app_lib::run()
// }


use tauri::Manager;
use window_vibrancy::{
    apply_acrylic, apply_mica, apply_tabbed, apply_vibrancy,
    NSVisualEffectMaterial, NSVisualEffectState,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            {
                apply_vibrancy(
                    &window,
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
                // apply_acrylic(&window, Some((0, 0, 0, 60))) // RGBA цвет подложки
                //     .expect("Failed to apply acrylic");

                // 🌫️ или Mica (матовый эффект, как в Win11)
                // apply_mica(&window, Some(true)).expect("Failed to apply mica");

                // 🪟 или Tabbed (вариант Mica для вкладок)
                // apply_tabbed(&window, Some(true)).expect("Failed to apply tabbed");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
