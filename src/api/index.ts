import { invoke } from "@tauri-apps/api/core";
import type { Feed, Article, PaginatedArticles, AiConfig } from "../types";

export async function addFeed(url: string): Promise<Feed> {
  return invoke("add_feed", { url });
}

export async function getFeeds(): Promise<Feed[]> {
  return invoke("get_feeds");
}

export async function getArticles(
  feedId?: string,
  starredOnly?: boolean,
  page?: number,
  pageSize?: number
): Promise<PaginatedArticles> {
  return invoke("get_articles", {
    feedId: feedId ?? null,
    starredOnly: starredOnly ?? false,
    page: page ?? 1,
    pageSize: pageSize ?? 50,
  });
}

export async function getArticle(id: string): Promise<Article> {
  return invoke("get_article", { id });
}

export async function markRead(id: string): Promise<void> {
  return invoke("mark_read", { id });
}

export async function markAllRead(feedId: string): Promise<void> {
  return invoke("mark_all_read", { feedId });
}

export async function toggleStar(id: string): Promise<boolean> {
  return invoke("toggle_star", { id });
}

export async function deleteFeed(id: string): Promise<void> {
  return invoke("delete_feed", { id });
}

export async function refreshAll(): Promise<number> {
  return invoke("refresh_all");
}

export async function refreshFeed(id: string): Promise<number> {
  return invoke("refresh_feed", { id });
}

export async function translateArticle(id: string): Promise<string> {
  return invoke("translate_article", { id });
}

export async function summarizeArticle(id: string): Promise<string> {
  return invoke("summarize_article", { id });
}

export async function getAiSettings(): Promise<AiConfig> {
  return invoke("get_ai_settings");
}

export async function saveAiSettings(config: AiConfig): Promise<void> {
  return invoke("save_ai_settings", { config });
}

export async function getLanguage(): Promise<string> {
  return invoke("get_language");
}

export async function setLanguage(language: string): Promise<void> {
  return invoke("set_language", { language });
}
