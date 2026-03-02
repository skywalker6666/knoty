# CLAUDE.md — Knoty Project Instructions

> Claude Code 啟動時自動載入此檔案。所有 AI-assisted 開發必須遵守以下規範。

---

## 專案概述

**Knoty** — 大學生人際關係圖譜管理工具。
用 Android 通知分析自動建圖，幫用戶理清誰跟誰好、避免社交踩雷。

- 品牌：Knoty（人際關係很 knotty，Knoty 幫你理清楚）
- 目標市場：台灣大學生 18-24 歲（Phase 1）
- 商業模式：Freemium（Free 30 節點 → Pro $1.99/mo → Pro+ $4.99/mo）
- 平台策略：Android-first + PWA（iOS 補位）
- 狀態：Sprint 0 技術驗證

---

## 技術棧（嚴格遵守，不可自行引入替代方案）

| 層 | 技術 | 備註 |
|----|------|------|
| Monorepo | Turborepo + pnpm workspaces | |
| Web | Next.js App Router + TypeScript | SSR + PWA |
| UI | Tailwind CSS + shadcn/ui | 不引入其他 UI library |
| Mobile | React Native (Android-first) | NotificationListenerService 用 Kotlin Native Module bridge |
| Graph Viz | D3.js (force-directed layout) | 已有 KnotyGraphV3.jsx 原型可參考 |
| API | Next.js API Routes | 不需獨立 backend |
| DB | PostgreSQL via Supabase | adjacency list + recursive CTE |
| Auth | Supabase Auth (Google + Email) | |
| Deploy | Vercel (Web) | |
| LLM - 風險分析 | Claude Sonnet 4.5 | via Pro subscription，Free 用戶每月 5 次 |
| LLM - 事件解析 | Gemini Flash | Free tier，1500 req/day |
| LLM - 標籤分類 | Gemini Flash | Free tier |

### 不使用

- Neo4j 或任何圖資料庫（PostgreSQL adjacency list 夠用，Phase 3 再評估）
- 額外 UI library（不用 MUI、Ant Design、Chakra 等）
- Firebase（統一用 Supabase）
- Express 或獨立 API server（用 Next.js API Routes）

---

## Monorepo 結構

```
knoty/
├── apps/
│   ├── web/                # Next.js App Router (PWA)
│   └── mobile/             # React Native (Android-first)
├── packages/
│   ├── shared/             # TypeScript types, validation (Zod), utils
│   ├── graph-engine/       # 圖譜計算：路徑搜尋、風險評估、佈局演算法
│   └── api-client/         # Supabase client wrapper + typed queries
├── supabase/
│   ├── migrations/         # SQL schema migrations (numbered)
│   └── seed.sql            # 測試資料
├── CLAUDE.md               # ← 你正在讀的這份
├── turbo.json
└── package.json
```

---

## 程式碼規範

### TypeScript
- `strict: true`，不允許 `any`（用 `unknown` + type guard）
- 共用型別定義在 `packages/shared/src/types.ts`，app 層 import 使用
- 用 Zod 做 runtime validation（API input/output）
- Prefer `interface` over `type` for object shapes
- 所有 async function 必須有 error handling（try-catch 或 Result pattern）

### 命名
- 檔案：`kebab-case.ts`（如 `risk-analyzer.ts`）
- Component：`PascalCase.tsx`（如 `GraphView.tsx`）
- 變數/函式：`camelCase`
- 常數：`UPPER_SNAKE_CASE`
- DB columns：`snake_case`

### Git
- Commit messages：conventional commits（`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`）
- 英文 commit message
- 每個功能一個 branch：`feat/person-crud`、`fix/graph-layout`

### Import 順序
```typescript
// 1. React / Next.js
// 2. Third-party libraries
// 3. @knoty/shared, @knoty/graph-engine, @knoty/api-client
// 4. Relative imports (components, hooks, utils)
// 5. Styles / assets
```

---

## 資料庫規範

### 核心 Tables
- `persons` — 人物節點（暱稱優先設計）
- `relationships` — 關係邊（雙向，CHECK person_a < person_b 防重複）
- `events` — 事件時間軸
- `circle_templates` — 情境模板（系統預設 + 用戶自訂）

### RLS（必須遵守）
所有 table 啟用 Row Level Security。Policy：`auth.uid() = user_id`。
絕對不可以用 `service_role` key 繞過 RLS 存取其他用戶資料。

### Migration 規範
- 檔名格式：`XXX_descriptive_name.sql`（如 `001_initial_schema.sql`）
- 每個 migration 必須可 rollback（提供 DOWN migration）
- 不直接改線上 DB，所有 schema 變更走 migration

### 查詢
- 社交風險分析用 `find_relationship_paths()` function（recursive CTE，已封裝）
- 最大搜尋深度 3 度（WHERE depth < 3）
- 個人規模圖譜（幾百節點）不需要特殊優化

---

## API 設計

### 路由結構
```
/api/persons          GET (list), POST (create)
/api/persons/[id]     GET, PATCH, DELETE
/api/relationships    GET (list), POST (create)
/api/relationships/[id]  PATCH, DELETE
/api/events           GET (list), POST (create)
/api/events/[id]      PATCH, DELETE
/api/risk-check       POST { talkingTo, aboutPerson, topic? }
/api/templates        GET (list system + user templates)
/api/onboarding       POST (apply template → batch create persons + relationships)
```

### 每個 API Route 必須
1. Zod validation on request body
2. Supabase Auth session check
3. 只透過 RLS-protected client 存取 DB
4. 回傳統一 error format：`{ error: string, code: string }`

---

## 隱私設計（核心原則，不可違反）

1. **暱稱優先**：UI 預設引導用暱稱/代稱建節點。通知分析抓到的真名在本地轉代稱，原始名字不寫入 DB
2. **本地優先處理**：通知分析在裝置端執行，不上傳原始通知內容到 server
3. **用戶隔離**：不做 cross-user 資料匹配、不做匿名化聚合統計
4. **不存取外部資料**：不讀取通訊錄、不呼叫社群媒體 API
5. **可刪除**：用戶可完整刪除所有資料（PDPA 合規）
6. **Client-side 不暴露 secrets**：`SUPABASE_SERVICE_ROLE_KEY` 只在 server-side 使用

---

## LLM 整合規範

### 社交風險分析（Claude Sonnet）
- 用途：分析 A-C 關係路徑 → 生成風險等級 + 建議
- 限制：Free 用戶每月 5 次，Pro 無限
- 語言：回覆用繁體中文
- 規則：
  - 不替用戶做社交決策（只提供「分析」和「建議」）
  - 不對真實人物做道德評判
  - 不鼓勵操縱或欺騙行為
  - 資料不足時明確說明，建議補充哪些資訊
  - 回覆控制在 300 字以內

### 事件解析（Gemini Flash）
- 用途：自然語言 → structured event JSON
- 輸出格式：`{ involved_persons, event_type, description, impact, occurred_at }`
- event_type 只能是：`conflict | favor | betrayal | reconcile | milestone | note`
- impact 範圍：-3 到 +3
- 模糊時預設 `event_type: "note"`, `impact: 0`

---

## UI/UX 指引

### 圖譜視覺化
- 預設**單中心模式**：「我」在中心，直接關係人環繞
- 非相關節點自動淡化（opacity 30%）
- 關係標籤預設隱藏，點擊展開
- 手機觸控：pinch zoom, drag 節點
- 顏色按圈子區分（社團、宿舍、班上、打工各一色）
- Closeness 用線條粗細 + 虛實表達：
  - 5=超熟（粗實線）→ 1=有嫌隙（細虛線紅色）

### 底部 Tab Bar
```
📋 首頁（圈子列表 + 最近事件 feed）
🔍 風險查詢（輸入兩個人，看關係分析）
➕ 快速記錄（一句話記事件）
🕸️ 圖譜探索（單中心 / 多中心 / 團體模式）
```

### 語言
- UI 文案：繁體中文（台灣用語，不用簡中或中國用語）
- 技術術語保留英文（如 "Graph"、"Node" 不需翻譯成「圖」「節點」在 code 裡）
- Placeholder / helper text 用口語化繁中（如「輸入你想聊到的人」而非「請輸入目標人物」）

---

## 測試

- API routes：用 Vitest 寫 unit test
- Components：用 React Testing Library
- 圖譜引擎：`packages/graph-engine` 必須有路徑搜尋的 edge case 測試
- E2E：Phase 2 再導入 Playwright
- 測試檔案放在同層 `__tests__/` 資料夾

---

## 版權與 IP 提醒

- **這是商業化產品**，所有產出必須注意 IP/版權風險
- 不引入 GPL-licensed 的 library（用 MIT / Apache 2.0）
- 不使用受版權保護的圖片/icon（用 Lucide icons 或自製 emoji 方案）
- 「Knoty」品牌名需在 Phase 1 前完成商標搜索
- 免責聲明必須在首次使用時顯示（見 Spec §8.2）

---

## Sprint 0 驗證目標（當前階段）

三個技術風險需通過 PoC：

1. **NotificationListenerService + React Native bridge**
   - 目標：RN app 可成功接收 LINE 通知事件並解析人名
   - 失敗退出：改用 Kotlin Native 或重新評估 Android-first 策略

2. **D3.js 力導向圖譜手機效能**
   - 目標：30 個節點在 Android 中低階機流暢互動（>30fps）
   - 失敗退出：遷移到 Cytoscape.js (Canvas) 或降級為列表視圖

3. **Supabase recursive CTE 查詢延遲**
   - 目標：find_relationship_paths() 在 200 節點下 < 100ms
   - 失敗退出：加 materialized view 或 pre-compute 常用路徑

---

## 常用指令參考

```bash
# 開發
pnpm dev                    # 全部 apps 同時 dev
pnpm dev --filter web       # 只跑 web
pnpm dev --filter mobile    # 只跑 RN

# 資料庫
npx supabase db push        # 執行 migration
npx supabase db reset       # 重置 + seed

# 測試
pnpm test                   # 全部測試
pnpm test --filter shared   # 只測 shared package

# 型別檢查
pnpm typecheck              # 全部 packages 型別檢查

# Lint
pnpm lint                   # ESLint 全部

# Build
pnpm build                  # 全部 build
```

---

## 相關文件

- 完整規格書：`Knoty-Spec.md`（在 portfolio-docs repo）
- 圖譜原型：`KnotyGraphV3.jsx`（D3.js 力導向互動圖譜，含單中心/多中心模式）
- Portfolio 架構：`Portfolio-Master-Architecture.md`
- Implementation Guide：`Knoty-Implementation-Guide.md`
