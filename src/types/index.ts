export interface Feed {
  id: string;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  icon: string | null;
  last_fetched: string | null;
  created_at: string;
  unread_count: number;
}

export interface Article {
  id: string;
  feed_id: string;
  feed_title: string | null;
  title: string;
  link: string | null;
  author: string | null;
  summary: string | null;
  content: string | null;
  pub_date: string | null;
  is_read: boolean;
  starred: boolean;
  translation: string | null;
  summary_ai: string | null;
  created_at: string;
}

export interface PaginatedArticles {
  articles: Article[];
  total: number;
  page: number;
  page_size: number;
}

export interface AiConfig {
  provider: string;
  api_key: string;
  base_url: string;
  model: string;
}
