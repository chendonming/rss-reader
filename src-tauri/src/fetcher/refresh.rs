use crate::db::Database;
use crate::fetcher;

pub fn refresh_single_feed(db: &Database, feed_id: &str) -> Result<usize, String> {
    let feeds = db.get_all_feeds().map_err(|e| e.to_string())?;
    let feed = feeds
        .into_iter()
        .find(|f| f.id == feed_id)
        .ok_or_else(|| {
            log::warn!("refresh_single_feed: feed not found: {}", feed_id);
            "Feed not found".to_string()
        })?;

    log::info!("refresh_single_feed: fetching '{}' ({})", feed.title, feed.url);
    let (_, _, _, articles) = fetcher::fetch_and_parse_feed(&feed.url)?;
    let count = articles.len();

    db.insert_articles(feed_id, &articles)
        .map_err(|e| e.to_string())?;
    db.update_feed_fetch_time(feed_id)
        .map_err(|e| e.to_string())?;

    log::info!("refresh_single_feed: {} new articles for feed '{}'", count, feed.title);
    Ok(count)
}

pub fn refresh_all_feeds(db: &Database) -> Result<usize, String> {
    let feeds = db.get_all_feeds().map_err(|e| e.to_string())?;
    log::info!("refresh_all_feeds: {} feeds to refresh", feeds.len());
    let mut total = 0;

    for feed in &feeds {
        match fetcher::fetch_and_parse_feed(&feed.url) {
            Ok((_, _, _, articles)) => {
                if let Err(e) = db.insert_articles(&feed.id, &articles) {
                    log::error!("refresh_all_feeds: failed to insert articles for feed {}: {}", feed.id, e);
                } else {
                    total += articles.len();
                    log::info!("refresh_all_feeds: {} new articles from '{}'", articles.len(), feed.title);
                }
                db.update_feed_fetch_time(&feed.id).ok();
            }
            Err(e) => {
                log::warn!("refresh_all_feeds: failed to fetch '{}': {}", feed.url, e);
            }
        }
    }

    log::info!("refresh_all_feeds: done, {} total new articles", total);
    Ok(total)
}
