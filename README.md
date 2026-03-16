# Knoty

> 人際關係很 knotty，Knoty 幫你理清楚。

大學生人際關係圖譜管理工具。透過 Android 通知分析自動建圖，幫用戶理清誰跟誰好、避免社交踩雷。

- **目標市場**：台灣大學生 18–24 歲（Phase 1）
- **商業模式**：Freemium — Free（30 節點）→ Pro $1.99/mo → Pro+ $4.99/mo
- **平台策略**：Android-first + PWA（iOS 補位）
- **狀態**：Sprint 0 技術驗證

---

## Tech Stack

| 層 | 技術 |
|----|------|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Next.js App Router + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Mobile | React Native (Android-first) |
| Graph Viz | D3.js force-directed layout |
| API | Next.js API Routes |
| DB | PostgreSQL via Supabase (adjacency list + recursive CTE) |
| Auth | Supabase Auth (Google + Email) |
| Deploy | Vercel (Web) |
| LLM 風險分析 | Claude Sonnet |
| LLM 事件解析 | Gemini Flash |

---

## 專案結構

```
knoty/
├── apps/
│   ├── web/                # Next.js App Router (PWA)
│   └── mobile/             # React Native (Android-first)
├── packages/
│   ├── shared/             # TypeScript types, Zod validation, utils
│   ├── graph-engine/       # 路徑搜尋、風險評估、佈局演算法
│   └── api-client/         # Supabase client wrapper + typed queries
├── supabase/
│   ├── migrations/         # SQL schema migrations
│   └── seed.sql
└── docs/
    └── superpowers/        # 設計文件 + 實作計畫
```

---

## 開發指令

```bash
# 安裝依賴
pnpm install

# 開發（全部 apps）
pnpm dev

# 只跑 web
pnpm dev --filter web

# 型別檢查
pnpm typecheck

# Lint
pnpm lint

# 測試
pnpm test

# Build
pnpm build

# DB migration
npx supabase db push

# DB reset + seed
npx supabase db reset
```

---

## Sprint 0 驗證目標

| PoC | 目標 | 狀態 |
|-----|------|------|
| D3.js 力導向圖譜手機效能 | 30 節點 Android 中低階機 > 30fps，三模式互動 | ✅ 完成 |
| NotificationListenerService + RN bridge | LINE 通知解析人名 | 待驗證 |
| Supabase recursive CTE 查詢延遲 | `find_relationship_paths()` 200 節點 < 100ms | 待驗證 |

---

## 圖譜功能（`/graph`）

- **三種模式**：單中心（我為圓心）、多中心（最多 3 人）、團體（自由佈局）
- **互動**：點擊選取、長壓 pin 節點、拖曳、雙指縮放
- **視覺**：5 級 Closeness 以線條粗細 + 顏色呈現，圈子以顏色區分
- **底部面板**：點擊節點展開關係資訊

---

## 文件

- `CLAUDE.md` — AI 輔助開發規範（技術棧、命名、DB 規範）
- `docs/Knoty-Spec.md` — 完整規格書
- `docs/superpowers/specs/` — 功能設計文件
- `supabase/migrations/001_initial_schema.sql` — DB Schema
