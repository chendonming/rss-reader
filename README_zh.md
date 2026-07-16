
<p align="center">
  <a href="README.md">🇬🇧 English</a>
</p>

<p align="center">
  <br>
  <a href="#">
    <img src="https://img.icons8.com/?size=128&id=82819&format=png" width="80" alt="rss-logo">
  </a>
  <br>
  <strong>RSS Reader</strong>
  <br>
  <sub>一款桌面 RSS 阅读器 — 简洁、快速、完全由 AI 构建。</sub>
  <br>
  <br>
  <sub>
    <a href="#功能特性">功能特性</a> ·
    <a href="#技术栈">技术栈</a> ·
    <a href="#架构">架构</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#快捷键">快捷键</a> ·
    <a href="#ai-集成">AI</a>
  </sub>
  <br>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI%20生成-100%25-8A2BE2?style=flat-square&logo=openai&logoColor=white" alt="AI 生成 100%">
  <img src="https://img.shields.io/badge/人类代码-0%25-ff6b6b?style=flat-square" alt="人类代码 0%">
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

## 🧠 零人类代码

> **本项目每一行代码 — 前端、后端、数据库 schema、AI 集成、样式、配置、甚至本 README — 均由大语言模型（Claude）全程生成。**
>
> **人类手写代码行数：`0`**
>
> 此项目旨在证明：现代 AI 已具备端到端构建生产级桌面应用程序的能力。

代码库包含 **约 2,921 行生产代码**，跨越 **60 个文件**，涵盖 Rust 后端（Tauri、SQLite）、TypeScript 前端（React、Mantine）、CSS 设计系统和国际化 — 没有一�字符是由人手键入的。

---

## 📸 截图

> *截图即将上线。界面采用"阅读室（The Reading Room）"设计风格，支持深色/浅色模式。*

---

## ✨ 功能特性

- **📡 订阅管理** — 订阅、刷新、组织 RSS/Atom 源，每隔 30 分钟自动后台同步
- **📖 阅读体验** — 简洁无干扰的文章视图，支持内容安全过滤
- **⭐ 星标收藏** — 通过星标系统标记文章以供稍后阅读
- **🔍 AI 翻译** — 使用 OpenAI 或 Anthropic 内联翻译文章，支持"替换原文"和"双语对照"两种布局
- **📝 AI 摘要** — 为任意文章生成简洁的 AI 摘要
- **🌗 深色/浅色模式** — 跟随系统偏好自动切换主题
- **🌐 国际化** — 完整的中英文双语支持
- **⌨️ 键盘导航** — Vim 风格快捷键，高效浏览
- **⚡ 极速体验** — SQLite 数据存储 + React Query 缓存，秒级响应
- **🪶 轻量高效** — 原生 Tauri 2.x 应用，无 Electron 开销

---

## 🛠 技术栈

| 层级 | 技术 | 代码行数 |
|-------|-----------|-------|
| **桌面壳** | [Tauri 2.x](https://v2.tauri.app/) (Rust) | — |
| **后端** | Rust + rusqlite + reqwest + feed-rs + tokio | **1,141** |
| **数据库** | SQLite（WAL 模式，2 张表，外键约束） | — |
| **前端** | React 19 + TypeScript 7 | **949** |
| **UI 框架** | Mantine 9 + Tabler Icons | — |
| **状态管理** | @tanstack/react-query 5 | — |
| **样式** | 自定义 CSS（"The Reading Room" 设计风格） | **831** |
| **AI** | OpenAI 兼容 / Anthropic API | — |
| **RSS 解析** | feed-rs 2 | — |
| **总计** | **60 个文件** | **~2,921** |

---

## 🏗 架构

```
┌─────────────────────────────┐
│  Tauri 2.x 桌面壳           │
│  ┌──────────────────────┐   │
│  │  React 19 前端       │   │
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
│  │  Rust 后端            │   │
│  │  ┌────────────────┐  │   │
│  │  │ IPC 命令       │  │   │
│  │  ├────────────────┤  │   │
│  │  │ RSS 抓取       │  │   │
│  │  │ (feed-rs)      │  │   │
│  │  ├────────────────┤  │   │
│  │  │ AI 客户端      │  │   │
│  │  │ (OpenAI/Anth.) │  │   │
│  │  ├────────────────┤  │   │
│  │  │ SQLite 数据库  │  │   │
│  │  │ (rusqlite)     │  │   │
│  │  └────────────────┘  │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### 数据流

1. **前端 → 后端**：所有数据通过 Tauri IPC (`invoke`) 传输，`src/api/index.ts` 中的封装为每个命令提供类型安全
2. **状态管理**：Rust 端持有 `AppState`（含 `Mutex<Database>` + `Mutex<AiConfig>`），前端使用 React Query 的 stale-while-revalidate 策略
3. **数据库**：SQLite WAL 模式 — `feeds` 和 `articles` 两张表，外键级联删除
4. **后台刷新**：`lib.rs::run()` 中的 Tokio 任务每 30 分钟自动刷新所有订阅源
5. **AI**：翻译和摘要结果缓存到数据库字段中，在阅读器 UI 中按需获取

### IPC 命令

`add_feed` · `get_feeds` · `get_articles` · `get_article` · `mark_read` · `mark_all_read` · `toggle_star` · `delete_feed` · `refresh_all` · `refresh_feed` · `translate_article` · `summarize_article` · `get_ai_settings` · `save_ai_settings` · `test_ai_connection` · `get_language` · `set_language` · `get_translation_layout` · `set_translation_layout`

---

## ⚡ 快速开始

```bash
# 前置条件：Rust 工具链、Node.js 20+、Tauri 系统依赖

# 安装前端依赖
npm install

# 启动开发服务器（端口 1420）
npm run dev

# 启动 Tauri 桌面应用（热重载）
npm run tauri dev

# 构建生产版本
npm run build
```

---

## ⌨️ 快捷键

| 按键 | 操作 |
|-----|--------|
| `j` / `↓` | 下一篇 |
| `k` / `↑` | 上一篇 |
| `s` | 切换星标 |
| `m` | 标记为已读 |
| `r` | 刷新当前订阅源 |
| `o` / `Enter` | 在浏览器中打开链接 |
| `Ctrl+,` | 打开设置 |

---

## 🤖 AI 集成

支持 **OpenAI 兼容** 和 **Anthropic** 两种提供商：

- **翻译** — 内联翻译文章全文。两种布局模式：替换原文或双语对照。支持强制重新翻译。
- **摘要** — 为任意文章生成简洁的 AI 摘要。

在设置面板（`Ctrl+,`）中配置 API 密钥、基础 URL 和模型。结果会缓存到数据库中，避免重复调用 API。

---

## 🗺 项目结构

```
src/                          # React 前端
├── main.tsx                  # 应用入口
├── App.tsx                   # 路由定义
├── api/index.ts              # Tauri IPC 封装
├── types/index.ts            # 共享 TypeScript 类型
├── components/
│   ├── Layout/               # 应用壳（导航栏 + 顶栏）
│   ├── FeedList/             # 订阅源侧边栏导航
│   └── ArticleReader/        # 文章阅读器（含 AI 功能）
├── pages/
│   ├── ArticleListPage.tsx   # 文章列表 + 阅读器分屏视图
│   └── SettingsPage.tsx      # AI 提供商配置
└── styles/                   # CSS 设计系统

src-tauri/                    # Rust 后端
├── src/
│   ├── lib.rs                # 应用设置、状态管理、后台刷新
│   ├── commands/mod.rs       # 所有 Tauri IPC 命令
│   ├── db/                   # 数据库（连接、模型、CRUD）
│   ├── fetcher/              # RSS 抓取与解析
│   └── ai/                   # AI 分发（OpenAI / Anthropic）
├── Cargo.toml
└── tauri.conf.json
```

---

## 🧪 AI 开发过程

本项目通过迭代式提示与 Claude（Anthropic 的 AI）协作构建。开发流程如下：

1. **项目脚手架** — 初始项目设置、依赖安装、配置文件
2. **后端先行** — 数据库 schema、RSS 抓取、IPC 命令层
3. **前端 UI** — React 组件、Mantine 集成、路由
4. **AI 集成** — OpenAI/Anthropic 客户端、翻译、摘要
5. **打磨完善** — 国际化、设计系统、快捷键、错误处理
6. **修复问题** — 每个遇到的 bug 均由 AI 诊断并修复

**每个迭代周期：** 描述功能 → AI 生成代码 → 审查 → 测试 → 下一个功能。

---

## 📜 许可证

MIT

---

<p align="center">
  <sub>
    完全由 AI 构建 · <a href="#">Claude</a> by Anthropic
    <br>
    <strong>0% 人类手写代码。100% 概念验证。</strong>
  </sub>
</p>
