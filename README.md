
<p align="center">
  <a href="README_zh.md">🇨🇳 中文</a>
</p>

<p align="center">
  <br>
  <a href="#">
    <img src="https://img.icons8.com/?size=128&id=82819&format=png" width="80" alt="rss-logo">
  </a>
  <br>
  <strong>RSS Reader</strong>
  <br>
  <sub>A desktop RSS reader — clean, fast, and powered entirely by AI.</sub>
  <br>
  <br>
  <sub>
    <a href="#features">Features</a> ·
    <a href="#tech-stack">Tech Stack</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="#quick-start">Quick Start</a> ·
    <a href="#keyboard-shortcuts">Shortcuts</a> ·
    <a href="#ai-integration">AI</a>
  </sub>
  <br>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Generated-100%25-8A2BE2?style=flat-square&logo=openai&logoColor=white" alt="AI Generated 100%">
  <img src="https://img.shields.io/badge/Human%20Code-0%25-ff6b6b?style=flat-square" alt="Human Code 0%">
  <img src="https://img.shields.io/github/commit-activity/t/user/rss-reader?style=flat-square" alt="Commits">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2.x">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Rust-1.85-F4660A?style=flat-square&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite">
  <br>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/status-alpha-orange?style=flat-square" alt="Alpha Status">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

<br>

## 🧠 Zero Human Code

> **Every single line of this project — frontend, backend, database schema, AI integration, styles, configuration, and even this README — was generated entirely by large language models (Claude).**
>
> **Lines written by humans: `0`**
>
> This project exists as a proof that modern AI is capable of producing production-quality desktop applications from end to end.

The codebase consists of **~2,921 lines of production code** across **60 files**, spanning Rust backend (Tauri, SQLite), TypeScript frontend (React, Mantine), CSS design system, and i18n — not a single character was typed by a human hand.

---

## 📸 Screenshots

> *Screenshots coming soon. The UI features a clean "Reading Room" design with dark/light mode support.*

---

## ✨ Features

- **📡 Feed Management** — Subscribe, refresh, organize RSS/Atom feeds with automatic background sync every 30 minutes
- **📖 Reading Experience** — Clean, distraction-free article view with content sanitization
- **⭐ Star & Read Later** — Mark articles for later with a star system
- **🔍 AI Translation** — Translate articles inline using OpenAI or Anthropic, with "replace" or "side-by-side" layout
- **📝 AI Summarization** — Generate concise AI summaries of any article
- **🌗 Dark / Light Mode** — Automatic theme following system preference
- **🌐 i18n** — Full Chinese and English localization
- **⌨️ Keyboard Navigation** — Vim-inspired shortcuts for efficient browsing
- **⚡ Blazing Fast** — SQLite-backed with stale-while-revalidate caching via React Query
- **🪶 Lightweight** — Native Tauri 2.x app, no Electron overhead

---

## 🛠 Tech Stack

| Layer | Technology | Lines |
|-------|-----------|-------|
| **Desktop Shell** | [Tauri 2.x](https://v2.tauri.app/) (Rust) | — |
| **Backend** | Rust with rusqlite, reqwest, feed-rs, tokio | **1,141** |
| **Database** | SQLite (WAL mode, 2 tables, FKs) | — |
| **Frontend** | React 19 + TypeScript 7 | **949** |
| **UI Framework** | Mantine 9 + Tabler Icons | — |
| **State / Data** | @tanstack/react-query 5 | — |
| **Styling** | Custom CSS ("The Reading Room" design) | **831** |
| **AI** | OpenAI-compatible / Anthropic API | — |
| **RSS Parsing** | feed-rs 2 | — |
| **Total** | **60 files** | **~2,921** |

---

## 🏗 Architecture

```
┌─────────────────────────────┐
│  Tauri 2.x Desktop Shell    │
│  ┌──────────────────────┐   │
│  │  React 19 Frontend   │   │
│  │  ┌────────────────┐  │   │
│  │  │ Mantine UI     │  │   │
│  │  │ React Query    │  │   │
│  │  │ React Router   │  │   │
│  │  │ i18next        │  │   │
│  │  └───────┬────────┘  │   │
│  │          │ IPC        │   │
│  └──────────┼───────────┘   │
│             │                │
│  ┌──────────┼───────────┐   │
│  │  Rust Backend        │   │
│  │  ┌────────────────┐  │   │
│  │  │ IPC Commands   │  │   │
│  │  ├────────────────┤  │   │
│  │  │ Fetcher        │  │   │
│  │  │ (feed-rs)      │  │   │
│  │  ├────────────────┤  │   │
│  │  │ AI Client      │  │   │
│  │  │ (OpenAI/Anth.) │  │   │
│  │  ├────────────────┤  │   │
│  │  │ SQLite DB      │  │   │
│  │  │ (rusqlite)     │  │   │
│  │  └────────────────┘  │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Data Flow

1. **Frontend → Backend**: All data flows through Tauri IPC (`invoke`). Wrappers in `src/api/index.ts` type-safe each command.
2. **State**: Rust holds `AppState` with `Mutex<Database>` + `Mutex<AiConfig>`. Frontend uses React Query with stale-while-revalidate.
3. **Database**: SQLite in WAL mode — `feeds` and `articles` tables with foreign key cascade delete.
4. **Background Refresh**: A Tokio task in `lib.rs::run()` refreshes all feeds every 30 minutes.
5. **AI**: Translation and summarization results cached in database columns — fetched on-demand from the reader UI.

### IPC Commands

`add_feed` · `get_feeds` · `get_articles` · `get_article` · `mark_read` · `mark_all_read` · `toggle_star` · `delete_feed` · `refresh_all` · `refresh_feed` · `translate_article` · `summarize_article` · `get_ai_settings` · `save_ai_settings` · `test_ai_connection` · `get_language` · `set_language` · `get_translation_layout` · `set_translation_layout`

---

## ⚡ Quick Start

```bash
# Prerequisites: Rust toolchain, Node.js 20+, Tauri system deps

# Install frontend dependencies
npm install

# Run development server (port 1420)
npm run dev

# Launch Tauri desktop app with hot-reload
npm run tauri dev

# Build for production
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `↓` | Navigate to next article |
| `k` / `↑` | Navigate to previous article |
| `s` | Toggle star on current article |
| `m` | Mark current article as read |
| `r` | Refresh current feed |
| `o` / `Enter` | Open article link in browser |
| `Ctrl+,` | Open settings |

---

## 🤖 AI Integration

Supports both **OpenAI-compatible** and **Anthropic** providers for:

- **Translation** — Translate full article content inline. Two layout modes: replace original content, or side-by-side view. Force re-translate option available.
- **Summarization** — Generate a concise AI summary of any article.

Configure your API key, base URL, and model in the Settings panel (`Ctrl+,`). Results are cached in the database to avoid redundant API calls.

---

## 🗺 Project Structure

```
src/                          # React frontend
├── main.tsx                  # App bootstrap
├── App.tsx                   # Route definitions
├── api/index.ts              # Tauri IPC wrappers
├── types/index.ts            # Shared TypeScript types
├── components/
│   ├── Layout/               # App shell (navbar + header)
│   ├── FeedList/             # Feed sidebar navigation
│   └── ArticleReader/        # Article reader with AI features
├── pages/
│   ├── ArticleListPage.tsx   # Article list + reader split view
│   └── SettingsPage.tsx      # AI provider configuration
└── styles/                   # CSS design system

src-tauri/                    # Rust backend
├── src/
│   ├── lib.rs                # App setup, state, background refresh
│   ├── commands/mod.rs       # All Tauri IPC commands
│   ├── db/                   # Database (connection, models, CRUD)
│   ├── fetcher/              # RSS fetch + parse
│   └── ai/                   # AI dispatch (OpenAI / Anthropic)
├── Cargo.toml
└── tauri.conf.json
```

---

## 🧪 AI-Generated Development Process

This project was built through iterative prompting with Claude (Anthropic's AI). The development process:

1. **Project scaffolding** — Initial project setup, dependencies, configuration
2. **Backend first** — Database schema, feed fetching, IPC command layer
3. **Frontend UI** — React components, Mantine integration, routing
4. **AI integration** — OpenAI/Anthropic client, translation, summarization
5. **Polish** — i18n, design system, keyboard shortcuts, error handling
6. **Bug fixing** — Every bug encountered was diagnosed and fixed by AI

**Each iteration:** Describe the feature → AI generates the code → Review → Test → Next feature.

---

## 📜 License

MIT

---

<p align="center">
  <sub>
    Built entirely with AI · <a href="#">Claude</a> by Anthropic
    <br>
    <strong>0% human written code. 100% proof of concept.</strong>
  </sub>
</p>
