// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn cache_path(app: &tauri::AppHandle, account_id: &str) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    if account_id.is_empty()
        || !account_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("invalid account id".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache");
    std::fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory.join(format!("account-{account_id}.json")))
}

#[tauri::command]
fn read_account_cache(app: tauri::AppHandle, account_id: String) -> Result<Option<String>, String> {
    let path = cache_path(&app, &account_id)?;
    match std::fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn write_account_cache(
    app: tauri::AppHandle,
    account_id: String,
    contents: String,
) -> Result<(), String> {
    let path = cache_path(&app, &account_id)?;
    let temporary = path.with_extension("json.tmp");
    std::fs::write(&temporary, contents).map_err(|e| e.to_string())?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    std::fs::rename(temporary, path).map_err(|e| e.to_string())
}

#[cfg(windows)]
#[tauri::command]
fn reset_media_permissions(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2Profile4, ICoreWebView2_13, COREWEBVIEW2_PERMISSION_KIND_CAMERA,
        COREWEBVIEW2_PERMISSION_KIND_MICROPHONE, COREWEBVIEW2_PERMISSION_STATE_DEFAULT,
    };
    use windows::core::{Interface, PCWSTR};

    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main webview window was not found".to_string())?;
    let origin = window
        .url()
        .map_err(|error| error.to_string())?
        .origin()
        .ascii_serialization();
    let origin = origin
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect::<Vec<_>>();

    window
        .with_webview(move |webview| unsafe {
            let result = (|| -> windows::core::Result<()> {
                let core = webview.controller().CoreWebView2()?;
                let core: ICoreWebView2_13 = core.cast()?;
                let profile: ICoreWebView2Profile4 = core.Profile()?.cast()?;
                let origin = PCWSTR::from_raw(origin.as_ptr());

                profile.SetPermissionState(
                    COREWEBVIEW2_PERMISSION_KIND_MICROPHONE,
                    origin,
                    COREWEBVIEW2_PERMISSION_STATE_DEFAULT,
                    None,
                )?;
                profile.SetPermissionState(
                    COREWEBVIEW2_PERMISSION_KIND_CAMERA,
                    origin,
                    COREWEBVIEW2_PERMISSION_STATE_DEFAULT,
                    None,
                )?;
                Ok(())
            })();

            if let Err(error) = result {
                eprintln!("failed to reset WebView2 media permissions: {error}");
            }
        })
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
fn reset_media_permissions(_app: tauri::AppHandle) -> Result<(), String> {
    Err("Сброс разрешений из приложения поддерживается только в Windows. Измените доступ в системных настройках конфиденциальности.".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_account_cache,
            write_account_cache,
            reset_media_permissions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
