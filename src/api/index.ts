import { invoke } from "@tauri-apps/api/core";
import type { Feed, Article, PaginatedArticles, AiConfig } from "../types";
import { log } from "../utils/logger";

async function invokeCmd<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (e) {
    log.error(`IPC "${command}" failed:`, e);
    throw e;
  }
}

export async function addFeed(url: string): Promise<Feed> {
  return invokeCmd("add_feed", { url });
}

export async function getFeeds(): Promise<Feed[]> {
  return invokeCmd("get_feeds");
}

export async function getArticles(
  feedId?: string,
  starredOnly?: boolean,
  page?: number,
  pageSize?: number
): Promise<PaginatedArticles> {
  return invokeCmd("get_articles", {
    feedId: feedId ?? null,
    starredOnly: starredOnly ?? false,
    page: page ?? 1,
    pageSize: pageSize ?? 50,
  });
}

export async function getArticle(id: string): Promise<Article> {
  return invokeCmd("get_article", { id });
}

export async function markRead(id: string): Promise<void> {
  return invokeCmd("mark_read", { id });
}

export async function markAllRead(feedId: string): Promise<void> {
  return invokeCmd("mark_all_read", { feedId });
}

export async function toggleStar(id: string): Promise<boolean> {
  return invokeCmd("toggle_star", { id });
}

export async function deleteFeed(id: string): Promise<void> {
  return invokeCmd("delete_feed", { id });
}

export async function refreshAll(): Promise<number> {
  return invokeCmd("refresh_all");
}

export async function refreshFeed(id: string): Promise<number> {
  return invokeCmd("refresh_feed", { id });
}

export async function translateArticle(id: string): Promise<string> {
  return invokeCmd("translate_article", { id });
}

export async function summarizeArticle(id: string): Promise<string> {
  return invokeCmd("summarize_article", { id });
}

export async function getAiSettings(): Promise<AiConfig> {
  return invokeCmd("get_ai_settings");
}

export async function saveAiSettings(config: AiConfig): Promise<void> {
  return invokeCmd("save_ai_settings", { config });
}

export async function getLanguage(): Promise<string> {
  return invokeCmd("get_language");
}

export async function setLanguage(language: string): Promise<void> {
  return invokeCmd("set_language", { language });
}
