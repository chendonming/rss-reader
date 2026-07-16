mod ai;
mod commands;
mod db;
mod fetcher;

use db::{AiConfig, Database};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Database>,
    pub ai_config: Mutex<AiConfig>,
    pub app_data_dir: Mutex<PathBuf>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(Database::new()),
            ai_config: Mutex::new(AiConfig::default()),
            app_data_dir: Mutex::new(PathBuf::new()),
        })
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();

            let state = app.state::<AppState>();
            *state.app_data_dir.lock().unwrap() = app_dir.clone();

            let db_path = app_dir.join("rss_reader.db");
            let mut db = state.db.lock().unwrap();
            db.init(&db_path.to_string_lossy())
                .expect("failed to initialize database");

            // Load saved AI config
            let config_path = app_dir.join("ai_config.json");
            if let Ok(content) = std::fs::read_to_string(&config_path) {
                if let Ok(config) = serde_json::from_str::<AiConfig>(&content) {
                    let mut ai_cfg = state.ai_config.lock().unwrap();
                    *ai_cfg = config;
                }
            }

            // Spawn background refresh task
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1800));
                loop {
                    interval.tick().await;
                    if let Some(state) = app_handle.try_state::<AppState>() {
                        let db = state.db.lock().unwrap();
                        let feeds = db.get_all_feeds().unwrap_or_default();
                        for feed in feeds {
                            if let Err(e) = fetcher::refresh::refresh_single_feed(&db, &feed.id) {
                                eprintln!("Failed to refresh feed {}: {}", feed.id, e);
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::add_feed,
            commands::get_feeds,
            commands::get_articles,
            commands::get_article,
            commands::mark_read,
            commands::mark_all_read,
            commands::toggle_star,
            commands::delete_feed,
            commands::refresh_all,
            commands::refresh_feed,
            commands::translate_article,
            commands::summarize_article,
            commands::get_ai_settings,
            commands::save_ai_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
