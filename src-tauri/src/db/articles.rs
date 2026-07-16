use rusqlite::params;
use uuid::Uuid;

use crate::db::{Article, Database, PaginatedArticles};

impl Database {
    pub fn insert_articles(&self, feed_id: &str, articles: &[Article]) -> rusqlite::Result<()> {
        for article in articles {
            // Check for duplicate by link
            if let Some(ref link) = article.link {
                let exists: bool = self
                    .conn()
                    .query_row(
                        "SELECT COUNT(*) > 0 FROM articles WHERE feed_id = ?1 AND link = ?2",
                        params![feed_id, link],
                        |row| row.get(0),
                    )
                    .unwrap_or(false);

                if exists {
                    continue;
                }
            }

            let id = Uuid::new_v4().to_string();
            self.conn().execute(
                "INSERT INTO articles (id, feed_id, title, link, author, summary, content, pub_date, is_read, starred)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, 0)",
                params![
                    id,
                    feed_id,
                    article.title,
                    article.link,
                    article.author,
                    article.summary,
                    article.content,
                    article.pub_date,
                ],
            )?;
        }
        Ok(())
    }

    pub fn get_articles(
        &self,
        feed_id: Option<&str>,
        starred_only: bool,
        page: u32,
        page_size: u32,
    ) -> rusqlite::Result<PaginatedArticles> {
        let offset = (page.saturating_sub(1)) * page_size;

        let (where_clause, count_clause) = if starred_only {
            ("WHERE a.starred = 1".to_string(), "WHERE a.starred = 1".to_string())
        } else if let Some(fid) = feed_id {
            (
                format!("WHERE a.feed_id = '{}'", fid.replace('\'', "''")),
                format!("WHERE a.feed_id = '{}'", fid.replace('\'', "''")),
            )
        } else {
            ("".to_string(), "".to_string())
        };

        let total: i64 = self.conn().query_row(
            &format!("SELECT COUNT(*) FROM articles a {}", count_clause),
            [],
            |row| row.get(0),
        )?;

        let query = format!(
            "SELECT a.id, a.feed_id, COALESCE(f.title, '') as feed_title,
                    a.title, a.link, a.author, a.summary, a.content, a.pub_date,
                    a.is_read, a.starred, a.translation, a.summary_ai, a.created_at
             FROM articles a
             LEFT JOIN feeds f ON a.feed_id = f.id
             {}
             ORDER BY a.pub_date DESC
             LIMIT ?1 OFFSET ?2",
            where_clause
        );

        let mut stmt = self.conn().prepare(&query)?;
        let articles = stmt
            .query_map(params![page_size, offset], |row| {
                Ok(Article {
                    id: row.get(0)?,
                    feed_id: row.get(1)?,
                    feed_title: row.get(2)?,
                    title: row.get(3)?,
                    link: row.get(4)?,
                    author: row.get(5)?,
                    summary: row.get(6)?,
                    content: row.get(7)?,
                    pub_date: row.get(8)?,
                    is_read: row.get::<_, i32>(9)? != 0,
                    starred: row.get::<_, i32>(10)? != 0,
                    translation: row.get(11)?,
                    summary_ai: row.get(12)?,
                    created_at: row.get(13)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(PaginatedArticles {
            articles,
            total,
            page,
            page_size,
        })
    }

    pub fn get_article(&self, id: &str) -> rusqlite::Result<Article> {
        self.conn().query_row(
            "SELECT a.id, a.feed_id, COALESCE(f.title, '') as feed_title,
                    a.title, a.link, a.author, a.summary, a.content, a.pub_date,
                    a.is_read, a.starred, a.translation, a.summary_ai, a.created_at
             FROM articles a
             LEFT JOIN feeds f ON a.feed_id = f.id
             WHERE a.id = ?1",
            params![id],
            |row| {
                Ok(Article {
                    id: row.get(0)?,
                    feed_id: row.get(1)?,
                    feed_title: row.get(2)?,
                    title: row.get(3)?,
                    link: row.get(4)?,
                    author: row.get(5)?,
                    summary: row.get(6)?,
                    content: row.get(7)?,
                    pub_date: row.get(8)?,
                    is_read: row.get::<_, i32>(9)? != 0,
                    starred: row.get::<_, i32>(10)? != 0,
                    translation: row.get(11)?,
                    summary_ai: row.get(12)?,
                    created_at: row.get(13)?,
                })
            },
        )
    }

    pub fn mark_read(&self, id: &str) -> rusqlite::Result<()> {
        self.conn()
            .execute("UPDATE articles SET is_read = 1 WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn mark_all_read(&self, feed_id: &str) -> rusqlite::Result<()> {
        self.conn().execute(
            "UPDATE articles SET is_read = 1 WHERE feed_id = ?1",
            params![feed_id],
        )?;
        Ok(())
    }

    pub fn toggle_star(&self, id: &str) -> rusqlite::Result<bool> {
        let current: i32 = self
            .conn()
            .query_row("SELECT starred FROM articles WHERE id = ?1", params![id], |row| {
                row.get(0)
            })?;

        let new_val = if current == 0 { 1 } else { 0 };
        self.conn()
            .execute("UPDATE articles SET starred = ?1 WHERE id = ?2", params![new_val, id])?;

        Ok(new_val != 0)
    }

    pub fn update_article_translation(&self, id: &str, translation: &str) -> rusqlite::Result<()> {
        self.conn().execute(
            "UPDATE articles SET translation = ?1 WHERE id = ?2",
            params![translation, id],
        )?;
        Ok(())
    }

    pub fn update_article_summary(&self, id: &str, summary: &str) -> rusqlite::Result<()> {
        self.conn().execute(
            "UPDATE articles SET summary_ai = ?1 WHERE id = ?2",
            params![summary, id],
        )?;
        Ok(())
    }
}
