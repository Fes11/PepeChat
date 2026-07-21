// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn cache_path(app: &tauri::AppHandle, account_id: &str) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    if account_id.is_empty() || !account_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("invalid account id".into());
    }
    let directory = app.path().app_data_dir().map_err(|e| e.to_string())?.join("cache");
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
fn write_account_cache(app: tauri::AppHandle, account_id: String, contents: String) -> Result<(), String> {
    let path = cache_path(&app, &account_id)?;
    let temporary = path.with_extension("json.tmp");
    std::fs::write(&temporary, contents).map_err(|e| e.to_string())?;
    if path.exists() { std::fs::remove_file(&path).map_err(|e| e.to_string())?; }
    std::fs::rename(temporary, path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_account_cache, write_account_cache])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
