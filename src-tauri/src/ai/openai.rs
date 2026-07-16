use crate::db::AiConfig;
use serde_json::json;

pub fn call(config: &AiConfig, prompt: &str) -> Result<String, String> {
    let base_url = config
        .base_url
        .trim_end_matches('/')
        .to_string();
    let url = format!("{}/chat/completions", base_url);

    let body = json!({
        "model": config.model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
    });

    let client = reqwest::blocking::Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .map_err(|e: reqwest::Error| format!("API request failed: {}", e))?;

    let status = response.status();
    let text = response
        .text()
        .map_err(|e: reqwest::Error| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        return Err(format!("API error ({}): {}", status, text));
    }

    let parsed: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse response: {}", e))?;

    let result = parsed["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Unexpected API response format".to_string())?
        .to_string();

    Ok(result)
}
