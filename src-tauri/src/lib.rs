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
    pub locale: Mutex<String>,
    pub app_data_dir: Mutex<PathBuf>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn")).init();
    log::info!("RSS Reader starting...");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(Database::new()),
            ai_config: Mutex::new(AiConfig::default()),
            locale: Mutex::new(String::new()),
            app_data_dir: Mutex::new(PathBuf::new()),
        })
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();

            log::info!("App data dir: {:?}", app_dir);

            let state = app.state::<AppState>();
            *state.app_data_dir.lock().unwrap() = app_dir.clone();

            let db_path = app_dir.join("rss_reader.db");
            let mut db = state.db.lock().unwrap();
            db.init(&db_path.to_string_lossy())
                .expect("failed to initialize database");
            log::info!("Database initialized at: {:?}", db_path);

            // Load saved AI config
            let config_path = app_dir.join("ai_config.json");
            if let Ok(content) = std::fs::read_to_string(&config_path) {
                if let Ok(config) = serde_json::from_str::<AiConfig>(&content) {
                    let mut ai_cfg = state.ai_config.lock().unwrap();
                    *ai_cfg = config;
                }
            }

            // Load saved locale
            let locale_path = app_dir.join("language.json");
            if let Ok(content) = std::fs::read_to_string(&locale_path) {
                let lang = content.trim().to_string();
                if !lang.is_empty() {
                    let mut locale = state.locale.lock().unwrap();
                    *locale = lang;
                }
            }

            // Spawn background refresh task
            log::info!("Spawning background refresh task (30-min interval)");
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1800));
                loop {
                    interval.tick().await;
                    // Get feed list quickly without holding the lock
                    let feeds = {
                        let state = match app_handle.try_state::<AppState>() {
                            Some(s) => s,
                            None => continue,
                        };
                        let db = match state.db.lock() {
                            Ok(guard) => guard,
                            Err(e) => {
                                log::error!("Background refresh: db lock poisoned: {}", e);
                                continue;
                            }
                        };
                        db.get_all_feeds().unwrap_or_default()
                    };
                    log::info!("Background refresh: {} feeds to check", feeds.len());
                    for feed in feeds {
                        let handle = app_handle.clone();
                        if let Err(e) = tokio::task::spawn_blocking(move || {
                            let state = match handle.try_state::<AppState>() {
                                Some(s) => s,
                                _ => return,
                            };
                            let db = match state.db.lock() {
                                Ok(guard) => guard,
                                Err(e) => {
                                    log::error!("Background refresh: db lock poisoned: {}", e);
                                    return;
                                }
                            };
                            if let Err(e) = fetcher::refresh::refresh_single_feed(&db, &feed.id) {
                                log::error!("Failed to refresh feed {}: {}", feed.id, e);
                            }
                        }).await {
                            log::error!("Background refresh task panicked: {:?}", e);
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
            commands::get_language,
            commands::set_language,
            commands::get_translation_layout,
            commands::set_translation_layout,
            commands::test_ai_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
