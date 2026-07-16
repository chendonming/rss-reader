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

pub fn call_translate(config: &AiConfig, content: &str) -> Result<String, String> {
    let prompt = format!(
        "Translate the following text to Chinese. Keep the original formatting (paragraphs, line breaks, etc.). Only output the translation, nothing else.\n\n---\n{}",
        content
    );
    call_ai(config, &prompt)
}

pub fn call_summarize(config: &AiConfig, content: &str) -> Result<String, String> {
    let prompt = format!(
        "Summarize the following article in 2-4 sentences in Chinese. Focus on the key points. Only output the summary, nothing else.\n\n---\n{}",
        content
    );
    call_ai(config, &prompt)
}

fn call_ai(config: &AiConfig, prompt: &str) -> Result<String, String> {
    match AiProvider::from_config(config) {
        AiProvider::OpenAI => openai::call(config, prompt),
        AiProvider::Anthropic => anthropic::call(config, prompt),
    }
}
