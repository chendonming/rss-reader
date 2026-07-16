pub mod models;
pub mod feeds;
pub mod articles;

use rusqlite::Connection;
pub use models::*;

pub struct Database {
    conn: Option<Connection>,
}

impl Database {
    pub fn new() -> Self {
        Database { conn: None }
    }

    pub fn init(&mut self, path: &str) -> rusqlite::Result<()> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS feeds (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                site_url TEXT,
                description TEXT,
                icon TEXT,
                last_fetched TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS articles (
                id TEXT PRIMARY KEY,
                feed_id TEXT NOT NULL,
                title TEXT NOT NULL,
                link TEXT,
                author TEXT,
                summary TEXT,
                content TEXT,
                pub_date TEXT,
                is_read INTEGER NOT NULL DEFAULT 0,
                starred INTEGER NOT NULL DEFAULT 0,
                translation TEXT,
                summary_ai TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
            CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read);
            CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date);",
        )?;

        self.conn = Some(conn);
        Ok(())
    }

    pub fn conn(&self) -> &Connection {
        self.conn
            .as_ref()
            .expect("Database not initialized. Call init() first.")
    }
}
