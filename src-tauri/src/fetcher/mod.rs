use crate::db::Article;
use feed_rs::parser;
use scraper::{Html, Selector};
use url::Url;

pub fn fetch_and_parse_feed(url: &str) -> Result<(String, Option<String>, Option<String>, Vec<Article>), String> {
    log::info!("fetch_and_parse_feed: fetching {}", url);
    let response = reqwest::blocking::get(url)
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;

    let bytes = response.bytes()
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

/// Fetch and extract readable content from an article URL.
/// Uses a Readability-inspired approach: tries <article> first,
/// then common content selectors, then falls back to all <p> tags.
pub fn fetch_article_content(url_str: &str) -> Result<String, String> {
    if url_str.is_empty() {
        return Err("Empty URL".to_string());
    }

    log::info!("fetch_article_content: fetching {}", url_str);

    let response = reqwest::blocking::get(url_str)
        .map_err(|e| format!("Failed to fetch page: {}", e))?;

    let html_str = response
        .text()
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let base_url = Url::parse(url_str).map_err(|e| format!("Invalid URL: {}", e))?;
    let document = Html::parse_document(&html_str);

    let content = extract_main_content(&document)
        .or_else(|| extract_by_selectors(&document))
        .unwrap_or_else(|| extract_all_paragraphs(&document));

    if content.is_empty() {
        return Err("No content could be extracted".to_string());
    }

    let cleaned = strip_noise_tags(&content);
    let resolved = resolve_urls(&cleaned, &base_url);

    log::info!("fetch_article_content: extracted {} chars", resolved.len());
    Ok(resolved)
}

fn extract_main_content(doc: &Html) -> Option<String> {
    let selectors = ["article", "[role=\"main\"]", "main"];
    for s in &selectors {
        if let Ok(sel) = Selector::parse(s) {
            if let Some(el) = doc.select(&sel).next() {
                let html = el.inner_html().trim().to_string();
                if html.len() > 100 {
                    return Some(html);
                }
            }
        }
    }
    None
}

fn extract_by_selectors(doc: &Html) -> Option<String> {
    let selectors = [
        "#content", ".content", "#article", ".article", "#post", ".post",
        ".post-content", ".entry-content", ".article-body", "#main", ".main",
        "#story", ".story-body",
    ];
    for s in &selectors {
        if let Ok(sel) = Selector::parse(s) {
            if let Some(el) = doc.select(&sel).next() {
                let html = el.inner_html().trim().to_string();
                if html.len() > 200 {
                    return Some(html);
                }
            }
        }
    }
    None
}

fn extract_all_paragraphs(doc: &Html) -> String {
    if let Ok(sel) = Selector::parse("p") {
        let paragraphs: Vec<String> = doc
            .select(&sel)
            .filter_map(|el| {
                let text = el.text().collect::<String>().trim().to_string();
                if text.len() > 20 {
                    Some(format!("<p>{}</p>", text))
                } else {
                    None
                }
            })
            .collect();

        if !paragraphs.is_empty() {
            return paragraphs.join("\n");
        }
    }

    // Ultimate fallback: raw body text
    if let Ok(body_sel) = Selector::parse("body") {
        if let Some(body) = doc.select(&body_sel).next() {
            let text = body.text().collect::<String>().trim().to_string();
            if !text.is_empty() {
                return text;
            }
        }
    }

    String::new()
}

fn strip_noise_tags(html: &str) -> String {
    let mut result = html.to_string();

    // Remove common noise elements and their content
    let noise_tags = [
        "script", "style", "nav", "header", "footer", "aside",
        "noscript", "iframe", "form", "svg",
    ];

    for tag in &noise_tags {
        // Handle both <tag>...</tag> and self-closing <tag ... />
        let pattern_open_close = format!("(?is)<{}[^>]*>.*?</{}>", tag, tag);
        if let Ok(re) = regex::Regex::new(&pattern_open_close) {
            result = re.replace_all(&result, "").to_string();
        }
    }

    // Clean excessive whitespace
    if let Ok(re) = regex::Regex::new(r"\s{3,}") {
        result = re.replace_all(&result, "\n\n").to_string();
    }

    result.trim().to_string()
}

fn resolve_urls(html: &str, base_url: &Url) -> String {
    // Resolve relative src and href attributes to absolute URLs
    if let Ok(re) = regex::Regex::new(r#"(src|href|data-src)=["']([^"']+)["']"#) {
        re.replace_all(html, |caps: &regex::Captures| {
            let attr = &caps[1];
            let value = &caps[2];

            if value.starts_with("http://")
                || value.starts_with("https://")
                || value.starts_with("data:")
                || value.starts_with("mailto:")
            {
                caps[0].to_string()
            } else if value.starts_with("//") {
                // Protocol-relative
                format!("{}=\"{}:{}\"", attr, base_url.scheme(), value)
            } else if value.starts_with('/') {
                // Absolute path
                let resolved = format!(
                    "{}://{}{}",
                    base_url.scheme(),
                    base_url.host_str().unwrap_or(""),
                    value
                );
                format!("{}=\"{}\"", attr, resolved)
            } else {
                // Relative path
                match base_url.join(value) {
                    Ok(abs) => format!("{}=\"{}\"", attr, abs),
                    Err(_) => caps[0].to_string(),
                }
            }
        })
        .to_string()
    } else {
        html.to_string()
    }
}
