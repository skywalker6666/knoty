# Knoty — 專案規格書
### Version 0.2 | 2026-02-27

---

## 1. 專案概述

**一句話定位：** 大學生人際關係圖譜管理工具——用 Android 通知分析自動建圖，幫你理清誰跟誰好、避免社交踩雷

**品牌概念：** 人際關係很 knotty（糾結），Knoty 幫你理清楚。Logo 意象為打結的線條逐漸展開成人際圖譜。

### 1.1 問題

大學生的人際關係是所有年齡層中變動最快、最複雜的：
- **社交踩雷代價極高**：在 A 面前說了 C 的壞話，結果被截圖傳出去，直接社死
- **小團體政治**：社團、班級、宿舍裡的派系和恩怨每學期都在洗牌
- **跨圈混亂**：同一個人可能同時在系群、社團群、宿舍群、打球群，角色完全不同
- **暗戀與八卦**：誰跟誰在一起、誰跟誰鬧翻，資訊量爆炸但只靠大腦記

### 1.2 解法

一個以「關係圖譜」為核心、Android 通知分析驅動的工具：
- **自動建圖**：分析 LINE、IG、Messenger 等通知，自動識別你的社交圈和互動頻率
- **社交風險分析**：輸入「我想跟 A 聊 C 的事」→ 系統提醒 A 和 C 的關係
- **情境模板快速補充**：社團、班級、宿舍等預設模板，快速完善圖譜
- **事件時間軸**：記錄誰幫過你、跟誰有過節，期末或畢業前回顧超有感

### 1.3 為什麼鎖定大學生

- **需求最強烈**：同儕壓力大、社交踩雷後果嚴重（被排擠、被已讀不回、被踢群）
- **關係變動最快**：每學期洗牌，持續需要更新和查詢
- **通知密度最高**：LINE 群組、IG 限動、Threads、Dcard，通知分析能撈到極豐富的社交信號
- **Android 佔比高**：台灣學生族群 Android 仍是主力，完美匹配通知分析策略
- **社交擴散快**：「你還沒用 Knoty？」一句話就能在社團裡傳開
- **長期價值**：大學養成使用習慣，畢業進職場自然轉成 Pro 用戶
- **文化加成**：台灣（及整個東亞）重視人情面子，踩雷成本特別高
- **無直接競品**：通訊錄管理只管聯絡方式，CRM 只管客戶；沒有工具管理「人與人之間的關係」

### 1.4 目標用戶

| 用戶類型 | Profile | 階段 |
|---------|---------|------|
| 主要 | 台灣大學生 18-24 歲，社團活躍、LINE 群組 10+ 個 | Phase 1 |
| 次要 | 25-35 歲職場新鮮人（從大學帶過來的用戶 + 職場社交需求） | Phase 2 |
| 延伸 | 高中生（16-18 歲，班級小團體） | Phase 3 |
| B2B 延伸 | 業務團隊客戶關係管理、社群經營者 | Phase 4 |

### 1.5 100% 原創 IP

本產品概念、品牌、UI/UX 設計均為原創。「Knoty」為確定品牌名，正式上線前需完成商標搜索。

---

## 2. 商業模式

### 2.1 Freemium 訂閱（學生友善定價）

| 方案 | 價格 | 功能 |
|------|------|------|
| Free | $0 | 管理 30 個人物節點、1 個情境圈、基礎圖譜視覺化、通知分析（基礎） |
| Pro | $1.99/mo | 無限節點、無限情境圈、AI 社交風險分析、事件時間軸、匯出、通知深度分析 |
| Pro+ (畢業後) | $4.99/mo | 全部 Pro 功能 + 職場模板 + B2B 團隊功能 | 

**為什麼 Free → Pro 會轉換：**
- 30 個節點在大學場景下很快用完（系上同學 + 社團 + 宿舍就超過了）
- AI 社交風險分析是殺手功能，Free 版只給每月 5 次試用
- 通知深度分析（跨 App 關係推斷）是 Pro 限定

**學生市場的變現策略：**
- Phase 1-2：以用戶量和口碑為主，不急著收費
- Phase 2：推出 Pro，用 $1.99 低門檻吃量（大學生可接受的飲料錢等級）
- Phase 3：畢業用戶自然升級 Pro+（職場需求 + 已有使用習慣 + 付費能力提升）
- 備選：探索校園大使計畫（免費 Pro 換社團推廣）

### 2.2 收入模型演化

```
Phase 1-2（學生養成期）：
  目標 = 用戶量 + 留存率，不是收入
  收入來源：少量 Pro 訂閱
  
Phase 3（開始變現）：
  大學用戶基數穩定 → Pro 轉換率提升
  畢業用戶進入職場 → Pro+ 自然升級
  
Phase 4（規模化）：
  B2B Team plan 上線
  跨市場擴展（日本、韓國大學生，同樣的同儕壓力文化）
```

### 2.3 Phase 2 目標

| 指標 | 目標 |
|------|------|
| 註冊用戶 | 3,000（大學生族群擴散快） |
| Pro 訂閱者 | 150（5% conversion） |
| WAU | 1,000 |
| MRR | $300 |

### 2.4 MVP 成本

< $15/mo（Supabase free tier + Vercel free tier + LLM ~$10 via premium subscriptions）

### 2.5 里程碑

```
Phase 0 (Month 0)：Spec 完成、Android PoC 技術驗證
Phase 1 (Month 1-3)：Android App 上線、通知分析 + 圖譜 CRUD、500 用戶（鎖定 2-3 個大學社團）
Phase 2 (Month 4-6)：AI 風險分析、事件時間軸、職場模板上線、Pro+ 上線、3,000 用戶、150 Pro
Phase 3 (Month 7-12)：高中生市場擴展（合規準備）、PWA/iOS 補齊、$500 MRR
Phase 4 (Month 12+)：B2B Team plan、擴展到日韓大學市場
```

---

## 3. 系統架構

### 3.1 架構總覽

```
┌─────────────────────────────────────────────────────────┐
│                   Knoty System                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Web App      │  │  API Layer   │  │  LLM Service  │  │
│  │  (Next.js)    │  │  (API Routes)│  │  (分析引擎)    │  │
│  │              │  │              │  │               │  │
│  │  • 圖譜編輯器 │  │  • CRUD API  │  │  • 風險分析   │  │
│  │  • 視覺化     │  │  • Auth      │  │  • 關係摘要   │  │
│  │  • 搜尋/篩選  │  │  • Export    │  │  • 事件分類   │  │
│  │  • 模板引導   │  │  • Webhooks  │  │               │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Database: PostgreSQL (Supabase)                         │
│  Graph queries via recursive CTE / adjacency list        │
└─────────────────────────────────────────────────────────┘
```

### 3.2 技術棧

| 層 | 選擇 | 備註 |
|----|------|------|
| Monorepo | Turborepo + pnpm workspaces | ✅ 已建立 |
| 前端 | **Next.js 16 (App Router)** + TypeScript strict | ✅ 已建立，React 19 |
| UI | Tailwind CSS v4 + shadcn/ui | ✅ 已整合 |
| Android App | React Native（Android-first） | ⏳ Sprint 0 PoC 待驗證 |
| 圖譜視覺化 | **D3.js** force-directed（已有 KnotyGraphV3.jsx 原型） | ⏳ Sprint 1 整合 |
| API | Next.js API Routes | ✅ `/api/health`、`/api/risk-check` 已上線 |
| 資料庫 | PostgreSQL via Supabase（adjacency list + recursive CTE） | ✅ schema + RLS + `find_relationship_paths()` 完成 |
| Auth | Supabase Auth（Google + Email） | ⏳ Sprint 1（目前 Sprint 0 hardcoded UID） |
| Validation | **Zod v4**（注意：`.uuid()` 強制 RFC 4122，DB ID 改用 format regex） | ✅ 已修正 |
| Calendar 整合 | Google Calendar API (OAuth 2.0) | Phase 1 |
| 通知分析 | Android NotificationListenerService | ⏳ Sprint 0 PoC 待驗證 |
| 部署 | Vercel | ⏳ 待部署 |
| LLM — 風險分析 | Claude Sonnet 4.6 | ⏳ Sprint 1（路徑查詢已通，AI 摘要待接） |
| LLM — 事件解析 | Gemini Flash | ⏳ Sprint 1 |

### 3.3 平台策略：Android-First

由於最強的 cold start 解法（通知歷史分析）只在 Android 可行，產品採用 Android-first 策略：

```
Phase 1：Android App（通知分析 + 圖譜核心功能）+ PWA（基礎版）
  → 用 Android 用戶驗證產品核心假設
  → PWA 同時服務 iOS 用戶（Google Calendar + 模板 + Share Sheet）

Phase 2：根據 Android 驗證結果決定 iOS 投資
  → 如果驗證成功：投資 iOS 原生 App（補齊 Share Sheet + 截圖 OCR 體驗）
  → 如果驗證失敗：不額外投資，檢討核心假設

Phase 3：雙平台完整體驗
  → Android：通知分析 + Calendar + Share Sheet + OCR
  → iOS：Calendar + Share Sheet + OCR + 持續觀察 Apple 開放通知 API 的可能性
```

### 3.3 為什麼不用圖資料庫（Neo4j）

MVP 階段用 PostgreSQL adjacency list + recursive CTE 就能處理個人規模的圖查詢（幾百個節點）。引入 Neo4j 增加基礎設施複雜度和成本，不划算。Phase 3 如果 B2B 場景需要大規模圖查詢再評估遷移。

### 3.4 圖譜視覺化設計

**手機螢幕限制下的核心原則：漸進式展開，而非一次全顯示。**

**單中心模式（預設）：**
- 預設顯示「我」在中心 + 所有直接關係人環繞
- 只顯示「我」到每個人的連線，不顯示他人之間的連線
- 關係標籤預設隱藏，點擊某人後才展開：該人的關係網 + 所有相關標籤
- 不相關的節點自動淡化（opacity 30%），聚焦當前查看的關係

**多中心模式（最多 3 個中心節點）：**

用於分析「我跟某人在這群人裡各自的關係」或「小團體 vs 大團體」。

```
操作方式：
  長按第二個人 → 「加入比較」→ 進入雙中心
  再長按第三個人 → 三中心
  超過 3 人 → 提示切換到列表/矩陣視圖

雙中心佈局（最常用）：
  ┌─────────────────────────────┐
  │                             │
  │    [A的人]   [共同]   [B的人] │
  │       \      / \      /     │
  │        [我]  ─  [女友]       │
  │       /      \ /      \     │
  │    [A的人]   [共同]   [B的人] │
  │                             │
  └─────────────────────────────┘
  - 兩個中心左右排列
  - 雙方都認識的人排在中間
  - 只有一方認識的排在各自外側
  - 一眼看出社交圈重疊程度

三中心佈局：
  ┌─────────────────────────────┐
  │         [中心A]              │
  │        / | \                │
  │   [A的] [AB交集] [A的]       │
  │      \   |   /              │
  │  [中心B]─┼─[中心C]           │
  │      / [ABC] \              │
  │   [B的]     [C的]            │
  └─────────────────────────────┘
  - 三角形佈局
  - 三方交集在三角形中央
  - 兩兩交集在對應邊上

超過 3 人 → 團體模式：
  - 切換到矩陣/列表視圖
  - 顯示每對成員之間的關係強度色塊
  - 手機上 4+ 個中心的圖譜一定會崩潰，不硬做
```

**殺手場景：**
- 情侶：「我跟女友在社團裡各自的關係」→ 雙中心，看誰跟誰比較熟
- 室友：「我跟室友在班上的共同朋友」→ 雙中心，中間的人就是共同社交圈
- 小團體：「我們三個在社團裡的盟友和對手」→ 三中心，外圍的人就是需要注意的

**底部 Tab Bar 結構：**
```
📋 首頁（圈子列表 + 最近事件 feed）
🔍 風險查詢（輸入兩個人，看關係分析）
➕ 快速記錄（一句話記事件）
🕸️ 圖譜探索（單中心 / 多中心 / 團體模式）
```

---

## 4. 資料模型

### 4.1 核心 Schema

```sql
-- 人物節點（暱稱優先設計）
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    display_name VARCHAR(100) NOT NULL,  -- 主要顯示名：暱稱/代稱/關係稱謂（如「社團學姐」）
    real_name_local VARCHAR(100),        -- 可選：真名，僅存於本地裝置，不同步到伺服器
    avatar_emoji VARCHAR(10),            -- 用 emoji 當頭像，降低隱私風險
    circles TEXT[] DEFAULT '{}',         -- 所屬情境圈: ["社團", "班上"]
    tags TEXT[] DEFAULT '{}',            -- 自定義標籤: ["話多", "值得信任"]
    notes TEXT,                          -- 私人備忘
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 關係邊（雙向）
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    person_a UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_b UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    closeness INT NOT NULL DEFAULT 3 CHECK (closeness BETWEEN 1 AND 5),
        -- 1=陌生/有嫌隙, 2=不太熟, 3=普通, 4=不錯, 5=非常好
    label VARCHAR(50),                 -- "同盟", "競爭", "表面客氣", "有心結"
    direction VARCHAR(20) DEFAULT 'mutual',
        -- "mutual"=雙向, "a_to_b"=A 單方面對 B 好, "b_to_a"=反向
    context VARCHAR(50),               -- 關係在哪個圈子: "職場", "朋友"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, person_a, person_b, context)
);

-- 事件時間軸
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    involved_persons UUID[] NOT NULL,  -- 涉及的人物 IDs
    event_type VARCHAR(30) NOT NULL,
        -- "conflict", "favor", "betrayal", "reconcile", "milestone", "note"
    description TEXT NOT NULL,         -- "A 在會議上幫我擋了一刀"
    impact INT DEFAULT 0 CHECK (impact BETWEEN -3 AND 3),
        -- -3=嚴重負面, 0=中性, +3=非常正面
    occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 情境模板（系統預設 + 用戶自訂）
CREATE TABLE circle_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,          -- "職場", "朋友圈", "家族"
    is_system BOOLEAN DEFAULT false,    -- true = 系統預設模板
    user_id UUID REFERENCES auth.users(id), -- null = 系統模板
    preset_roles TEXT[] DEFAULT '{}',   -- ["直屬主管", "同部門同事", "跨部門窗口"]
    preset_labels TEXT[] DEFAULT '{}',  -- ["同盟", "競爭", "表面客氣"]
    description TEXT
);
```

### 4.2 關鍵查詢

```sql
-- 查詢: A 和 C 之間的關係路徑（社交風險分析的基礎）
WITH RECURSIVE path AS (
    SELECT person_b AS current_node,
           ARRAY[person_a, person_b] AS visited,
           closeness,
           1 AS depth
    FROM relationships
    WHERE user_id = $1 AND person_a = $person_a_id

    UNION ALL

    SELECT r.person_b,
           p.visited || r.person_b,
           LEAST(p.closeness, r.closeness),
           p.depth + 1
    FROM relationships r
    JOIN path p ON r.person_a = p.current_node
    WHERE r.user_id = $1
      AND r.person_b != ALL(p.visited)
      AND p.depth < 3  -- 最多 3 度分隔
)
SELECT * FROM path WHERE current_node = $person_c_id;

-- 查詢: 某人的共同群組（點子 A 自然融入）
SELECT p.name, array_agg(c) AS shared_circles
FROM persons p
WHERE p.user_id = $1
  AND p.circles && (SELECT circles FROM persons WHERE id = $target_person_id)
GROUP BY p.id;
```

### 4.3 API Contracts

```typescript
// 人物 CRUD
interface Person {
    id: string;
    name: string;
    nickname?: string;
    avatarEmoji?: string;
    circles: string[];
    tags: string[];
    notes?: string;
}

// 關係
interface Relationship {
    id: string;
    personA: string;      // Person ID
    personB: string;      // Person ID
    closeness: 1 | 2 | 3 | 4 | 5;
    label?: string;
    direction: 'mutual' | 'a_to_b' | 'b_to_a';
    context?: string;
    notes?: string;
}

// 社交風險查詢
// POST /api/risk-check
interface RiskCheckRequest {
    from_id: string;   // 我要跟誰講（A）的 person UUID
    to_id:   string;   // 我要聊到的人（C）的 person UUID
    // topic 欄位保留給 Sprint 1 Claude AI 分析用
}

interface RiskCheckResponse {
    paths:     RelationPath[];  // A 和 C 之間的關係路徑（Sprint 0 已實作）
    pathCount: number;
    // Sprint 1 待實作（Claude Sonnet AI 分析）：
    // riskLevel: 'safe' | 'caution' | 'danger';
    // summary:    string;   // AI 生成的風險摘要
    // suggestion: string;   // AI 建議（該不該聊、怎麼聊）
}

// 事件記錄
interface Event {
    id: string;
    involvedPersons: string[];
    eventType: 'conflict' | 'favor' | 'betrayal' | 'reconcile' | 'milestone' | 'note';
    description: string;
    impact: number;                // -3 to +3
    occurredAt: string;            // ISO date
}
```

---

## 5. LLM 策略

### 5.1 使用邊界

| 允許（核心功能） | 禁止 |
|-----------------|------|
| ✅ 社交風險分析（基於用戶自建的關係資料） | ❌ 替用戶做社交決策（只提供分析，不下指令） |
| ✅ 事件分類與情緒標籤 | ❌ 對真實人物做道德評判 |
| ✅ 關係變化趨勢摘要 | ❌ 鼓勵操縱或欺騙行為 |
| ✅ 快速記錄的自然語言解析 | ❌ 存取用戶通訊錄或社群媒體資料 |

### 5.2 模型選擇

| 角色 | 模型 | 成本 |
|------|------|------|
| 社交風險分析 + 建議生成 | Claude Sonnet 4.5 | via Claude Pro subscription |
| 自然語言事件解析 | Gemini Flash | Free tier |
| 情緒/關係標籤分類 | Gemini Flash | Free tier |

### 5.3 社交風險分析 Prompt Template

```
You are a social relationship advisor. Respond in Traditional Chinese.

User's relationship graph context:
- Person A ({person_a_name}): {person_a_tags}, circles: {person_a_circles}
- Person C ({person_c_name}): {person_c_tags}, circles: {person_c_circles}
- Relationship between A and C: {relationship_data}
- Recent events involving A or C: {recent_events}

User wants to discuss {topic} about C with A.

Analysis required:
1. Risk level (safe / caution / danger) based on A-C relationship closeness
2. Key factors (shared circles, recent events, relationship direction)
3. One concrete suggestion: what to say or avoid

Guidelines:
- Be practical and culturally aware (Taiwan social norms)
- Never encourage manipulation or deception
- If data is insufficient, say so and suggest what info to add
- Keep response under 300 characters
```

### 5.4 自然語言事件解析 Prompt

```
Parse the following note into structured event data. Respond in JSON only.

User's note: "{user_input}"
Known persons: {person_list_with_ids}

Output format:
{
    "involved_persons": ["id1", "id2"],
    "event_type": "conflict|favor|betrayal|reconcile|milestone|note",
    "description": "清理後的描述",
    "impact": -3 to 3,
    "occurred_at": "YYYY-MM-DD or null"
}

If person names don't match known persons, use closest match.
If ambiguous, set event_type to "note" and impact to 0.
```

### 5.5 成本控制

```
社交風險分析（Claude Sonnet）：
  Pro 用戶平均 5 次/天 → via Claude Pro subscription（$0 額外 API）
  若超量需走 API：~$0.005/query → 500 queries/day = $2.5/day

事件解析（Gemini Flash）：
  Free tier 1,500 req/day → 足夠 MVP

Phase 1 目標：$0 額外 LLM 成本（全部走 premium subscription）
```

---

## 6. Cold Start 解決方案

> 這是本產品的核心挑戰。解決不好，產品死在第一步。
> 目前評估 cold start 解決程度：8/10（Android 通知分析後大幅提升，iOS 仍有差距）

### 6.0 Android 通知歷史分析（最強 Cold Start 解法）

**核心價值：跨應用被動捕捉社交信號，用戶幾乎零輸入就能建出初始圖譜。**

Android 的 `NotificationListenerService` API 允許第三方 App 在用戶授權後讀取所有 App 的通知內容。這意味著可以自動分析：
- LINE 群組訊息：誰在哪些群組裡發言、互動頻率
- IG 通知：誰 tag 了你、誰對你的貼文按讚
- FB / Messenger 通知：誰傳訊息、誰在貼文互動
- Email 通知：誰寄信給你、頻率如何
- 任何其他社群 App 的通知

**自動建圖邏輯：**
```
用戶授權 NotificationListenerService
  → 回掃裝置通知歷史（三星等可保留數月）
  → 提取所有通知中的人名 / 用戶名稱 / email
  → 頻率分析：按人物分群，計算互動次數
  → 共現分析：A 和 C 同時出現在同一群組通知 → 推斷 A-C 有關聯
  → 自動生成人物節點 + 初步關係邊
  → 用戶只需確認和微調，不需要從零開始建圖
```

**為什麼這是突破性解法：**
- 解決「人物節點」預填：通知裡出現的人自動成為節點
- 部分解決「人與人之間的關係」：群組共現 = 有某種關聯（不再只是「都出現在我的行事曆裡」）
- 覆蓋範圍遠超 Google Calendar：日常線上互動、群組聊天、社群通知全部涵蓋
- 不依賴任何單一平台 API：是 Android 系統級功能，Meta/LINE 擋不了

**持續監聽（日常更新）：**
```
授權後持續在背景監聽新通知
  → 即時更新互動頻率
  → 偵測到新人物 → 提示「要加入圖譜嗎？」
  → 偵測到互動頻率變化 → 提示「你跟 A 最近互動變少了」
```

**隱私設計（關鍵）：**
- 所有分析在本地裝置執行，不上傳原始通知內容到伺服器
- 只提取並儲存：人名、App 來源、時間戳、頻率統計
- 用戶可選擇排除特定 App 的通知（如金融、醫療類）
- 隨時可撤銷權限，撤銷後刪除所有通知分析資料
- 權限授權頁面需清楚說明讀取範圍和用途

**iOS 限制：**
iOS 不開放第三方 App 讀取其他 App 的通知內容（系統層級封鎖，無等效 API）。EU 監管壓力下 Apple 在 iOS 26.3 新增了歐洲限定的通知轉發功能，但僅限藍牙穿戴裝置，不適用於第三方 App。因此 iOS 用戶退回 Google Calendar + 模板 + Share Sheet 方案。

**平台 Cold Start 評分：**

| 平台 | Cold Start 方案 | 評分 |
|------|----------------|------|
| Android | 通知歷史分析 + Google Calendar + 模板 | 8.5/10 |
| iOS | Google Calendar + 模板 + Share Sheet | 7/10 |
| 綜合 | | 8/10 |

### 6.1 Google Calendar 自動觸發與預填（跨平台通用）

**核心價值：補充通知分析覆蓋不到的「有安排的社交」，並提供跨平台一致體驗。**

**自動預填（解決 cold start）：**
- 用戶授權 Google Calendar 後，系統回掃過去 3 個月的事件
- 提取事件中反覆出現的參與者（email / 顯示名稱）
- 自動生成人物節點候選清單，用戶只需確認和補充
- 根據共同出席事件的頻率，預估初始 closeness 值
- 效果：用戶幾乎不需要手動填人，打開就有一張基礎圖

**智慧觸發（解決日常記錄摩擦）：**
```
用戶在 Google Calendar 建立事件，包含其他參與者
  → Knoty 偵測到新事件
  → 事件前：推播「你即將跟 A、B 見面，查看關係備忘？」
  → 事件後（+2hr）：推播「聚會結束了，有什麼值得記一筆的嗎？」
  → 用戶點擊 → 進入快速事件記錄頁（預填參與者）
```

**技術實作：**
- Google Calendar API (OAuth 2.0) 取得事件讀取權限
- Webhook 訂閱事件變更（push notification channel）
- 回掃邏輯：`calendarList.list` → `events.list` per calendar，提取 `attendees[]`
- 頻率分析：SQL GROUP BY attendee_email, COUNT(*) 排序

**隱私考量：**
- 僅讀取事件參與者和時間，不讀取事件內容/描述
- 用戶可選擇哪些日曆要同步（排除私人日曆）
- 隨時可斷開授權，斷開後刪除所有 Calendar 相關資料

**尚未解決的 gap（持續探索中）：**
- iOS 用戶無法使用通知分析，體驗落差明顯（持續觀察 Apple 政策變化，特別是 EU 監管壓力下的開放趨勢）
- 通知分析能推斷「A 跟 C 有關聯」（群組共現），但無法推斷「關係好壞」——closeness 和 label 仍需用戶手動設定
- 通知內容解析的準確度依賴各 App 的通知格式，需針對主流 App（LINE、IG、FB、Messenger）做專門的 parser
- 隱私敏感度高，需要非常透明的說明和嚴格的本地處理，否則會嚇跑用戶

### 6.1 情境模板系統

用戶首次進入不是空白頁，而是選擇一個最像自己的起點：

**模板 1：社團（預設首推）**
- 預填角色：社長、副社長、同屆幹部 ×3、學長姐 ×2、學弟妹 ×2
- 預設關係標籤：同陣營、對立、表面和氣、罩我的、有心結
- Hook：社團政治是大學生社交踩雷的重災區

**模板 2：班級/系上**
- 預填分群：同組報告夥伴、班代周圍的人、常一起吃飯的、只有上課會見到的
- 預設關係標籤：超熟、普通、點頭之交、有嫌隙
- 附帶「共同群組」連線引導

**模板 3：宿舍**
- 預填角色：室友 ×3、隔壁房、同樓層常碰到的
- 台灣大學宿舍特色：四人房的微妙關係動態
- 預設關係標籤：好 bro、互不干涉、有摩擦、已經冷戰

**模板 4：打工/實習**
- 預填角色：店長、同班次同事、其他班次同事
- 為 Phase 3 職場延伸做準備

**模板 5：自訂圈子**
- 通用模板，適用於教會、讀書會、球隊等

### 6.2 三步引導流程

```
Step 1: 選模板（可複選）
  → "你最想管理哪個圈子的關係？" 
  → [職場] [朋友圈] [家族] [社群] [自訂]

Step 2: 快速填人（5-8 個關鍵人物）
  → 根據模板預填角色名稱（如「直屬主管」）
  → 用戶只需把角色替換成真實名字
  → 支援 emoji 頭像選擇（降低輸入門檻）

Step 3: 快速連線（只處理重要關係）
  → 顯示人物配對列表
  → 用戶用滑桿設定親疏度（1-5）
  → 標記「不確定」的跳過（預設為 3=普通）
  → 只需處理 user 標記「重要」的連線
```

**目標：2-3 分鐘內產出一張可用的基礎關係圖。**

### 6.3 社群信號捕捉（不依賴平台 API）

**設計原則：讓用戶成為資料的搬運者，而不是讓系統去抓資料。**

Meta 系（IG、FB、Threads）的 API 對第三方幾乎全面封鎖個人社交資料，任何依賴平台 API 權限的整合隨時會被收回。以下兩條路都走 OS 層級功能，不受平台限制：

**Share Sheet 整合：**
```
用戶在 IG/Threads/FB/LINE 看到朋友的貼文或互動
  → 按「分享」→ 選擇 Knoty
  → 系統解析分享內容中的用戶名稱 / 顯示名稱
  → 自動比對已有人物節點（fuzzy match）
  → 彈出快速記錄頁：「你跟 [人名] 有什麼新動態？」
  → 用戶一句話記錄 → Gemini Flash 解析 → 更新關係圖譜
```
- iOS / Android 原生 Share Extension，不需要任何平台 API
- 支援所有社群 App（IG、Threads、FB、LINE、Twitter、WhatsApp）
- 解析邏輯：提取 URL 中的 username、分享文字中的 @mention 或顯示名稱

**截圖 OCR 辨識：**
```
用戶截一張聊天記錄 / 社群互動的圖
  → 匯入 Knoty（從相簿選取或直接分享）
  → OCR 辨識畫面中的人名、對話片段
  → 自動比對已有人物節點
  → 建議關係更新：「偵測到你跟 A 的對話，要記錄什麼嗎？」
```
- 使用 Gemini Flash vision 或 Tesseract OCR
- 可辨識 LINE 聊天、IG DM、Messenger 等多平台截圖格式
- 隱私：OCR 在本地或用戶自己的帳號範圍內處理，不上傳原圖到公開服務

**這兩條路的定位：**
- 不是 cold start 的解法（初始建圖仍靠 Google Calendar + 模板）
- 而是「日常持續更新」的低摩擦入口
- 讓用戶在使用任何社群 App 的過程中順手帶資訊進來
- 不依附任何平台 API = 不會淪為平台的棋子

### 6.4 多入口架構（降低日常使用摩擦）

| 入口 | 用途 | 觸發場景 | 優先級 |
|------|------|---------|--------|
| Android 通知分析 | 自動建圖 + 持續更新互動頻率 | 背景持續監聽 | Phase 1（Android 主力） |
| Google Calendar 自動觸發 | 見面前提醒查看關係、見面後提醒記錄事件 | 有人參與的行事曆事件 | Phase 1（跨平台） |
| PWA push notification | 每週提醒更新過期關係 | 定時推播 | Phase 1 |
| PWA 桌面快捷 | 一點開啟快速記錄頁 | 用戶主動記錄 | Phase 1 |
| Share Sheet | 社群互動後順手記錄 | 在任何 App 按分享 | Phase 2 |
| 截圖 OCR | 聊天記錄快速匯入 | 用戶截圖後分享或匯入 | Phase 2 |
| Apple Calendar 整合 | 擴大 iOS 用戶覆蓋 | 同 Google Calendar | Phase 2 |
| 其他觸發源 | 持續探索中 | TBD | TBD |

### 6.5 持續補充機制

**快速事件記錄（降低日常輸入摩擦）：**
```
用戶輸入：「今天老王在會議上幫我擋了一刀」
→ Gemini Flash 解析 → 自動識別「老王」→ event_type: favor, impact: +2
→ 自動更新老王的 closeness 權重
→ 用戶只需確認，不用手動填表
```

**定期提醒（保持資料新鮮）：**
- 每週推播：「你有 3 個關係超過 30 天沒更新，還準確嗎？」
- 智慧提醒：如果某人的 closeness 是 1（有嫌隙）但超過 60 天沒更新 → 提醒「你跟 XX 的狀況有改善嗎？」

**漸進式擴充：**
- 每當用戶新增一個人，系統提示：「要不要設定 [新人物] 和已有人物的關係？」
- 只列出同圈子的人物，不強迫設定所有連線

---

## 7. 跨專案整合點

### 7.1 與其他專案的潛在整合

| 專案 | 整合方式 | 階段 | 價值 |
|------|---------|------|------|
| SEEDCRAFT | 家長社群內的成員關係管理（「哪些家長跟班導師很熟」） | Phase 3 | 🟡 中 |
| SmartChoice | 聚餐推薦時考慮「這群人之間的關係」避免尷尬組合 | Phase 3 | 🟢 低 |

### 7.2 獨立優先

Knoty 的核心價值不依賴其他專案。跨專案整合是加分項，Phase 1-2 完全獨立開發。

### 7.3 點子 A（共同群組顯示）的整合位置

點子 A 作為 Knoty 內建功能自然存在：
- 當用戶查看某個人物時，自動顯示「與你共同的圈子」
- 在圖譜視覺化中，同圈子的人物用相同顏色標示
- 這不是獨立功能，而是圖譜的基礎呈現方式

---

## 8. 版權與法律風險

### 8.1 風險矩陣

**🟡 MEDIUM（從 HIGH 降級）：個人隱私資料處理**
- 用戶記錄的是「其他真實人物」的資訊，但系統引導使用暱稱/代稱而非真名
- **暱稱策略（核心隱私設計）：**
  - Onboarding 引導用戶用暱稱、小名或關係稱謂建立節點（如「社團學姐」「隔壁室友」「報告組的那個」）
  - 通知分析自動抓到的真名在本地解析後轉為用戶自訂代稱，原始名字不寫入資料庫
  - 資料庫存的是「社團學長 A 跟宿舍室友 B 有嫌隙」而非真名，即使資料外洩也無法對應真實身份
  - 用戶仍可選擇輸入真名（自行承擔），但 UI 預設引導為代稱
- 額外措施：所有資料僅用戶自己可見、不做跨用戶資料匹配、不存取通訊錄或社群媒體、明確告知資料用途和儲存方式
- PDPA 合規：用戶可完整刪除所有資料、提供資料匯出功能
- 未成年用戶（Phase 3 高中生）：需額外處理法定代理人同意流程

**🟡 MEDIUM：AI 社交建議的責任**
- 如果用戶依據 AI 建議行動導致社交問題
- Mitigation：免責聲明（「本分析僅供參考，不構成行為指導」）、AI 回覆中避免絕對性語言（「建議」而非「應該」）

**🟡 MEDIUM：資料洩漏風險**
- 關係資料極為敏感（誰跟誰有嫌隙）
- Mitigation：Supabase RLS 確保用戶只能存取自己的資料、不做任何匿名化分析或聚合統計、Team plan 的共享圖譜需明確 opt-in

**🟢 LOW：品牌/IP 侵權**
- 「Knoty」為確定品牌名，上線前需完成商標搜索確認可註冊
- Mitigation：正式命名前做商標查詢、避免與既有社交分析工具撞名

### 8.2 必要免責聲明（首次使用時顯示）

```
歡迎使用 Knoty！

Knoty 幫你記錄和管理人際關係，避免社交踩雷。
• 所有資料僅儲存在你的帳號中，不會與其他用戶共享
• 通知分析在本地裝置執行，不上傳原始通知內容
• AI 分析建議僅供參考，不構成任何行為指導
• 你可以隨時匯出或完整刪除所有資料
• 請勿記錄他人的敏感個資（身分證號、醫療資訊等）

使用本服務即表示你同意我們的服務條款與隱私政策。
```

### 8.3 合規 TODO

- [ ] 服務條款草擬（涵蓋「第三方個資記錄」的免責）
- [ ] PDPA 資料刪除工作流實作
- [ ] 資料加密方案評估（client-side encryption for sensitive notes）
- [ ] 商標搜索（正式產品名）
- [ ] 安全審計：Supabase RLS 規則驗證

---

## 9. 成功標準與退出條件

| 階段 | 成功標準 | 退出條件 |
|------|---------|---------|
| Phase 1 | 500 用戶（2-3 個大學社團）, 200 WAU, onboarding 完成率 > 60% | 3 個月, < 50 WAU or onboarding < 30% |
| Phase 2 | 3,000 用戶, 150 Pro subscribers (5% conversion) | 6 個月, < 3% conversion |
| Phase 3 | $500 MRR, 高中生市場 pilot 啟動 | 12 個月, < $200 MRR |
| Phase 4 | $2K MRR, < 5% monthly churn, 1 個海外大學市場 | 連續 3 個月 MRR 下降 |

**核心指標（North Star Metric）：**
- 每周人均「關係查詢/風險分析」次數 > 5（大學生社交頻率高，門檻比職場人高）
- 代表用戶真的在用 Knoty 做社交決策

**擴散指標（學生特有）：**
- 單一社團/班級滲透率 > 30% = 達到 network effect 臨界點
- 邀請轉換率 > 15%（「你還沒用 Knoty？」的社交壓力驅動）

**每週時間投入：** 待排入 Portfolio 後決定（取決於哪個專案先完成釋出產能）

---

## 10. 下一步行動

### 10.1 Phase 0：技術驗證（進行中）

> **Sprint 0 Web 基礎建設（✅ 已完成）**
>
> 先建立 Web app 基礎，讓 Sprint 1 的 UI 功能可以快速接上。
>
> | 項目 | 狀態 |
> |------|------|
> | Turborepo + pnpm monorepo 骨架 | ✅ |
> | Supabase schema（4 tables + RLS + index） | ✅ |
> | `find_relationship_paths()` recursive CTE（bidirectional BFS） | ✅ |
> | Seed 測試資料（8 人物、7 關係、6 事件、5 模板） | ✅ |
> | `@knoty/api-client`（browser / server / admin client） | ✅ |
> | `@knoty/shared` TypeScript 型別定義 | ✅ |
> | `@knoty/graph-engine`（normalizeEdge、buildAdjacencyList + 測試） | ✅ |
> | 首頁（真實 DB 資料：圈子列表 + 事件 feed） | ✅ |
> | 風險查詢頁（選人 → 呼叫 `/api/risk-check` → 顯示路徑） | ✅ |
> | `/api/health`、`/api/risk-check` API 路由 | ✅ |
> | Bottom Tab Bar 導航 | ✅ |
> | 企業 Proxy 支援（instrumentation.ts + undici ProxyAgent） | ✅ |
> | 快速記錄頁 | ⏳（UI stub 已建，Gemini 解析 Sprint 1） |
> | 圖譜視覺化（D3.js） | ⏳（Sprint 1） |

> **Sprint 0 三大技術 PoC（⏳ 待驗證）**

```
PoC 1：NotificationListenerService + React Native Bridge
  - [ ] 建立 React Native 專案骨架（Android-first）
  - [ ] 實作 NotificationListenerService 整合
  - [ ] 通知解析 PoC：LINE / IG / Messenger 通知格式 parser
  - [ ] 驗證本地通知分析的可行性和準確度
  - 目標：RN app 成功接收 LINE 通知事件並解析人名
  - 失敗退出：改用 Kotlin Native 或重新評估 Android-first 策略

PoC 2：D3.js 力導向圖譜手機效能
  - [ ] 將 KnotyGraphV3.jsx 整合進 Next.js web app
  - [ ] 在 Android 中低階機測試 30 個節點互動效能
  - 目標：> 30fps
  - 失敗退出：遷移到 Cytoscape.js（Canvas）或降級為列表視圖

PoC 3：find_relationship_paths() 效能驗證
  - [ ] 建立 200 節點的壓力測試資料集
  - [ ] 測量查詢延遲
  - 目標：< 100ms
  - 失敗退出：加 materialized view 或 pre-compute 常用路徑
  - 備注：函式已建立（bidirectional BFS，COALESCE user_id 參數化）
```

**Sprint 1 下一步（Web 功能）：**
```
  - [ ] Supabase Auth 接入（取代 hardcoded UID）
  - [ ] Persons / Relationships CRUD API 路由
  - [ ] D3.js 圖譜視覺化整合
  - [ ] 快速記錄（Gemini Flash 事件解析）
  - [ ] Claude Sonnet 風險分析文字（riskLevel + summary + suggestion）
  - [ ] 情境模板 onboarding 三步引導流程
```

### 10.2 待決事項

| 項目 | 選項 | 決策時間 |
|------|------|---------|
| 商標搜索 | 確認「Knoty」可註冊 | Phase 1 前 |
| Android 框架 | React Native vs Kotlin Native | Sprint 0（PoC 驗證 NotificationListenerService 整合難度後決定） |
| 圖譜引擎 | D3.js vs React Flow vs Cytoscape.js | Sprint 0 |
| 通知 Parser 覆蓋範圍 | 先做 LINE + IG + Messenger，還是先做最多人用的前 3 個 | Sprint 0 |
| iOS App 投資時機 | Phase 2 驗證成功後 vs 同步開發 | Phase 2 |
| 資料加密 | server-side only vs client-side E2E（通知資料敏感度高） | Phase 1 |
| 多語系 | 繁中 only vs 繁中+英文 | Phase 2 |

### 10.3 開發狀態

此專案已於 2026-03 正式啟動 Sprint 0 技術驗證。Web app 基礎建設已完成，進行中。

---

*Owner: Alan | Created: 2026-02-27 | Updated: 2026-03-13 | Status: V0.3 — Sprint 0 進行中（Web 基礎建設完成，三大技術 PoC 待驗證）*
