# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Frontend dev server (Vite, port 1420)
npm run dev

# Full Tauri development (desktop app with hot-reload)
npm run tauri dev

# Type-check frontend + build Vite output
npm run build

# Preview Vite build
npm run preview

# Tauri CLI shortcut
npm run tauri
```

## Project Architecture

**Desktop RSS reader** — Tauri 2.x shell with a React 19 + Mantine 9 UI and SQLite backend (rusqlite).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2.x (Rust) |
| Frontend | React 19, TypeScript 7, Vite 8 |
| UI | Mantine 9, Tabler Icons, react-router-dom 7 |
| State / data | @tanstack/react-query 5 |
| Backend DB | SQLite via rusqlite 0.31 (bundled) |
| HTTP | reqwest 0.12 |
| RSS parsing | feed-rs 2 |
| AI | OpenAI / Anthropic API |

### Directory Structure

```
rss-reader/
├── index.html              # Entry HTML
├── package.json
├── vite.config.ts          # Vite config (port 1420, HMR)
├── tsconfig.json
├── postcss.config.cjs      # Mantine PostCSS preset
├── public/                 # Static assets
├── src/                    # Frontend (React + TypeScript)
│   ├── main.tsx            # Bootstrap: Mantine, React Query, Router
│   ├── App.tsx             # Route definitions
│   ├── types/index.ts      # Feed, Article, PaginatedArticles, AiConfig
│   ├── api/index.ts        # Tauri IPC wrappers (invoke calls)
│   ├── styles/             # CSS files
│   ├── components/
│   │   ├── Layout/AppLayout.tsx        # App shell (navbar + header)
│   │   ├── FeedList/FeedList.tsx       # Sidebar feed navigation
│   │   ├── FeedList/AddFeedModal.tsx   # Add feed modal
│   │   └── ArticleReader/ArticleReader.tsx  # Article reader with AI
│   └── pages/
│       ├── ArticleListPage.tsx         # Article list + reader split
│       └── SettingsPage.tsx            # AI provider config
└── src-tauri/              # Backend (Rust)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/default.json
    ├── icons/
    └── src/
        ├── main.rs
        ├── lib.rs           # App setup, state, background refresh
        ├── commands/mod.rs  # All Tauri IPC commands
        ├── db/
        │   ├── mod.rs       # Database struct, init, schema DDL
        │   ├── models.rs    # Feed, Article, AiConfig, PaginatedArticles
        │   ├── feeds.rs     # Feed CRUD
        │   └── articles.rs  # Article CRUD
        ├── fetcher/
        │   ├── mod.rs       # RSS fetch + parse
        │   └── refresh.rs   # Refresh all/single feed
        └── ai/
            ├── mod.rs       # AI dispatch (translate/summarize)
            ├── openai.rs    # OpenAI API client
            └── anthropic.rs # Anthropic API client
```

### Key Patterns

**Frontend → Backend**: All data flows through Tauri IPC. The frontend calls `invoke("command_name", { args })` via wrappers in `src/api/index.ts`. Commands return `Result<T, String>` — errors propagate as rejected promises.

**State management**: The Rust side holds `AppState` with `Mutex<Database>` and `Mutex<AiConfig>`. The frontend uses React Query for caching, stale-while-revalidate, and mutation invalidation.

**Database**: SQLite with WAL mode. Two tables: `feeds` (id, title, url, site_url, etc.) and `articles` (id, feed_id, title, content, is_read, starred, translation, summary_ai). Foreign key with CASCADE delete.

**AI integration**: Translation and summarization are cached in the database (`articles.translation` and `articles.summary_ai` columns). Supports OpenAI-compatible and Anthropic providers. Results are fetched on-demand from the reader UI.

**Background refresh**: A Tokio task spawned in `lib.rs::run()` refreshes all feeds every 30 minutes.

**Keyboard shortcuts**: Handled via `@mantine/hooks` `useHotkeys` — j/k (navigate), s (star), m (mark read), r (refresh), o (open in browser), Ctrl+, (settings).

### IPC Commands

| Command | Description |
|---------|------------|
| `add_feed` | Subscribe to RSS feed (fetches immediately) |
| `get_feeds` | List all feeds with unread counts |
| `get_articles` | Paginated articles (filter by feed/starred) |
| `get_article` | Single article (auto-marks read) |
| `mark_read` / `mark_all_read` | Read state |
| `toggle_star` | Star/unstar |
| `delete_feed` | Unsubscribe (cascades to articles) |
| `refresh_all` / `refresh_feed` | Fetch new articles |
| `translate_article` / `summarize_article` | AI features (cached) |
| `get_ai_settings` / `save_ai_settings` | AI config CRUD |

### Testing

No test infrastructure is currently set up (no test framework in dependencies, no test files found).
