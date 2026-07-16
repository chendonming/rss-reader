pub mod openai;
pub mod anthropic;

use crate::db::AiConfig;

pub enum AiProvider {
    OpenAI,
    Anthropic,
}

impl AiProvider {
    pub fn from_config(config: &AiConfig) -> Self {
        match config.provider.to_lowercase().as_str() {
            "anthropic" => AiProvider::Anthropic,
            _ => AiProvider::OpenAI,
        }
    }
}

pub async fn call_translate(config: &AiConfig, content: &str) -> Result<String, String> {
    let prompt = format!(
        "Translate the following text to Chinese. Use Markdown for formatting (lists, code blocks, etc.). Only output the translation, nothing else.\n\n---\n{}",
        content
    );
    call_ai(config, &prompt).await
}

pub async fn call_summarize(config: &AiConfig, content: &str) -> Result<String, String> {
    let prompt = format!(
        "Summarize the following article in 2-4 sentences in Chinese. Focus on the key points. Only output the summary, nothing else.\n\n---\n{}",
        content
    );
    call_ai(config, &prompt).await
}

pub async fn call_test(config: &AiConfig) -> Result<String, String> {
    let prompt = "Reply with just the word OK.";
    call_ai(config, prompt).await
}

async fn call_ai(config: &AiConfig, prompt: &str) -> Result<String, String> {
    match AiProvider::from_config(config) {
        AiProvider::OpenAI => openai::call(config, prompt).await,
        AiProvider::Anthropic => anthropic::call(config, prompt).await,
    }
}
