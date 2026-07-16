use crate::db::Database;
use crate::fetcher;

pub fn refresh_single_feed(db: &Database, feed_id: &str) -> Result<usize, String> {
    let feeds = db.get_all_feeds().map_err(|e| e.to_string())?;
    let feed = feeds
        .into_iter()
        .find(|f| f.id == feed_id)
        .ok_or_else(|| "Feed not found".to_string())?;

    let (_, _, _, articles) = fetcher::fetch_and_parse_feed(&feed.url)?;
    let count = articles.len();

    db.insert_articles(feed_id, &articles)
        .map_err(|e| e.to_string())?;
    db.update_feed_fetch_time(feed_id)
        .map_err(|e| e.to_string())?;

    Ok(count)
}

pub fn refresh_all_feeds(db: &Database) -> Result<usize, String> {
    let feeds = db.get_all_feeds().map_err(|e| e.to_string())?;
    let mut total = 0;

    for feed in &feeds {
        match fetcher::fetch_and_parse_feed(&feed.url) {
            Ok((_, _, _, articles)) => {
                if let Err(e) = db.insert_articles(&feed.id, &articles) {
                    eprintln!("Failed to insert articles for feed {}: {}", feed.id, e);
                } else {
                    total += articles.len();
                }
                db.update_feed_fetch_time(&feed.id).ok();
            }
            Err(e) => {
                eprintln!("Failed to fetch feed {}: {}", feed.url, e);
            }
        }
    }

    Ok(total)
}
