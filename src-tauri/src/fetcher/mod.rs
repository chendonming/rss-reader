pub mod refresh;

use crate::db::Article;
use feed_rs::parser;

pub fn fetch_and_parse_feed(url: &str) -> Result<(String, Option<String>, Option<String>, Vec<Article>), String> {
    log::info!("fetch_and_parse_feed: fetching {}", url);
    let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
    let response = rt
        .block_on(async { reqwest::get(url).await })
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;

    let bytes = rt
        .block_on(async { response.bytes().await })
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let feed = parser::parse(&bytes[..]).map_err(|e| format!("Failed to parse feed: {}", e))?;

    let feed_title = feed.title.map(|t| t.content).unwrap_or_else(|| "Untitled".to_string());
    let site_url = feed.links.first().map(|l| l.href.clone());
    let feed_description = feed.description.map(|d| d.content);

    let mut articles = Vec::new();
    for entry in feed.entries {
        let title = entry.title.map(|t| t.content).unwrap_or_else(|| "Untitled".to_string());
        let link = entry.links.first().map(|l| l.href.clone());
        let author = entry.authors.first().map(|a| a.name.clone()).or_else(|| {
            entry
                .contributors
                .first()
                .map(|c| c.name.clone())
        });
        let pub_date = entry.updated.map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string());
        let summary = entry.summary.map(|s| s.content);
        let content = entry
            .content
            .and_then(|c| c.body)
            .or_else(|| {
                entry
                    .media
                    .first()
                    .and_then(|m| m.description.as_ref().map(|d| d.content.clone()))
            });

        articles.push(Article {
            id: String::new(),
            feed_id: String::new(),
            feed_title: None,
            title,
            link,
            author,
            summary,
            content,
            pub_date,
            is_read: false,
            starred: false,
            translation: None,
            summary_ai: None,
            created_at: String::new(),
        });
    }

    Ok((feed_title, site_url, feed_description, articles))
}
