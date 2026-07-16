use crate::db::{AiConfig, PaginatedArticles};
use crate::fetcher;
use crate::AppState;
use crate::{ai, db::Feed};
use tauri::State;

#[tauri::command]
pub fn add_feed(state: State<'_, AppState>, url: String) -> Result<Feed, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    if db.feed_exists_by_url(&url).map_err(|e| e.to_string())? {
        return Err("Feed already exists".to_string());
    }

    let (title, site_url, description, articles) = fetcher::fetch_and_parse_feed(&url)?;
    let feed = db
        .add_feed(&url, &title, site_url.as_deref(), description.as_deref())
        .map_err(|e| e.to_string())?;
    db.insert_articles(&feed.id, &articles)
        .map_err(|e| e.to_string())?;

    Ok(feed)
}

#[tauri::command]
pub fn get_feeds(state: State<'_, AppState>) -> Result<Vec<Feed>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_feeds().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_articles(
    state: State<'_, AppState>,
    feed_id: Option<String>,
    starred_only: Option<bool>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<PaginatedArticles, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_articles(
        feed_id.as_deref(),
        starred_only.unwrap_or(false),
        page.unwrap_or(1),
        page_size.unwrap_or(50),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_article(state: State<'_, AppState>, id: String) -> Result<crate::db::Article, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let article = db.get_article(&id).map_err(|e| e.to_string())?;

    // Auto-mark as read
    db.mark_read(&id).ok();

    Ok(article)
}

#[tauri::command]
pub fn mark_read(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.mark_read(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_all_read(state: State<'_, AppState>, feed_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.mark_all_read(&feed_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_star(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.toggle_star(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_feed(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_feed(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn refresh_all(state: State<'_, AppState>) -> Result<usize, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    fetcher::refresh::refresh_all_feeds(&db)
}

#[tauri::command]
pub fn refresh_feed(state: State<'_, AppState>, id: String) -> Result<usize, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    fetcher::refresh::refresh_single_feed(&db, &id)
}

#[tauri::command]
pub fn translate_article(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Check cache first
    let article = db.get_article(&id).map_err(|e| e.to_string())?;
    if let Some(ref translation) = article.translation {
        if !translation.is_empty() {
            return Ok(translation.clone());
        }
    }

    // Get content to translate
    let content = article
        .content
        .or(article.summary)
        .ok_or_else(|| "No content to translate".to_string())?;

    // Get AI config
    let ai_config = state.ai_config.lock().map_err(|e| e.to_string())?;
    if ai_config.api_key.is_empty() {
        return Err("AI API key not configured. Please go to Settings.".to_string());
    }

    let result = ai::call_translate(&ai_config, &content)?;

    // Cache result
    db.update_article_translation(&id, &result)
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub fn summarize_article(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Check cache first
    let article = db.get_article(&id).map_err(|e| e.to_string())?;
    if let Some(ref summary_ai) = article.summary_ai {
        if !summary_ai.is_empty() {
            return Ok(summary_ai.clone());
        }
    }

    // Get content to summarize
    let content = article
        .content
        .or(article.summary)
        .ok_or_else(|| "No content to summarize".to_string())?;

    // Get AI config
    let ai_config = state.ai_config.lock().map_err(|e| e.to_string())?;
    if ai_config.api_key.is_empty() {
        return Err("AI API key not configured. Please go to Settings.".to_string());
    }

    let result = ai::call_summarize(&ai_config, &content)?;

    // Cache result
    db.update_article_summary(&id, &result)
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub fn get_ai_settings(state: State<'_, AppState>) -> Result<AiConfig, String> {
    let ai_config = state.ai_config.lock().map_err(|e| e.to_string())?;
    Ok(ai_config.clone())
}

#[tauri::command]
pub fn get_language(state: State<'_, AppState>) -> Result<String, String> {
    let locale = state.locale.lock().map_err(|e| e.to_string())?;
    Ok(locale.clone())
}

#[tauri::command]
pub fn set_language(state: State<'_, AppState>, language: String) -> Result<(), String> {
    let mut locale = state.locale.lock().map_err(|e| e.to_string())?;
    *locale = language.clone();

    // Persist to disk
    let app_dir = state
        .app_data_dir
        .lock()
        .map_err(|e| e.to_string())?
        .clone();
    let locale_path = app_dir.join("language.json");
    std::fs::write(locale_path, language).ok();

    Ok(())
}

#[tauri::command]
pub fn save_ai_settings(state: State<'_, AppState>, config: AiConfig) -> Result<(), String> {
    let mut ai_config = state.ai_config.lock().map_err(|e| e.to_string())?;
    *ai_config = config.clone();

    // Persist to disk
    let app_dir = state
        .app_data_dir
        .lock()
        .map_err(|e| e.to_string())?
        .clone();
    let config_path = app_dir.join("ai_config.json");
    if let Ok(content) = serde_json::to_string_pretty(&config) {
        std::fs::write(config_path, content).ok();
    }

    Ok(())
}
