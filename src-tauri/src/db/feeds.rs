use rusqlite::params;
use uuid::Uuid;

use crate::db::{Database, Feed};

impl Database {
    pub fn add_feed(&self, url: &str, title: &str, site_url: Option<&str>, description: Option<&str>) -> rusqlite::Result<Feed> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        self.conn().execute(
            "INSERT INTO feeds (id, title, url, site_url, description, last_fetched, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, title, url, site_url, description, now, now],
        )?;

        Ok(Feed {
            id,
            title: title.to_string(),
            url: url.to_string(),
            site_url: site_url.map(|s| s.to_string()),
            description: description.map(|s| s.to_string()),
            icon: None,
            last_fetched: Some(now.clone()),
            created_at: now,
            unread_count: 0,
        })
    }

    pub fn get_all_feeds(&self) -> rusqlite::Result<Vec<Feed>> {
        let mut stmt = self.conn().prepare(
            "SELECT f.id, f.title, f.url, f.site_url, f.description, f.icon, f.last_fetched, f.created_at,
                    COALESCE((SELECT COUNT(*) FROM articles WHERE feed_id = f.id AND is_read = 0), 0) as unread_count
             FROM feeds f
             ORDER BY f.title ASC",
        )?;

        let feeds = stmt
            .query_map([], |row| {
                Ok(Feed {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    url: row.get(2)?,
                    site_url: row.get(3)?,
                    description: row.get(4)?,
                    icon: row.get(5)?,
                    last_fetched: row.get(6)?,
                    created_at: row.get(7)?,
                    unread_count: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(feeds)
    }

    pub fn delete_feed(&self, id: &str) -> rusqlite::Result<()> {
        self.conn()
            .execute("DELETE FROM articles WHERE feed_id = ?1", params![id])?;
        self.conn()
            .execute("DELETE FROM feeds WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_feed_fetch_time(&self, id: &str) -> rusqlite::Result<()> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        self.conn()
            .execute("UPDATE feeds SET last_fetched = ?1 WHERE id = ?2", params![now, id])?;
        Ok(())
    }

    pub fn feed_exists_by_url(&self, url: &str) -> rusqlite::Result<bool> {
        let count: i64 = self
            .conn()
            .query_row("SELECT COUNT(*) FROM feeds WHERE url = ?1", params![url], |row| {
                row.get(0)
            })?;
        Ok(count > 0)
    }
}
