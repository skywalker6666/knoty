# DB 串接 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將首頁、圖譜頁、風險查詢頁從靜態 mock 資料換成 Supabase 真實查詢。

**Architecture:** 用 `service_role key` 建立 `createAdminClient()`，在 Next.js Server Components 直接查詢 Supabase，繞過 RLS（Sprint 0 策略）。風險查詢需要動態參數，另建 `/api/risk-check` Route Handler。

**Tech Stack:** Next.js 16 App Router, @supabase/ssr 0.5, TypeScript strict, Tailwind CSS, Vitest

---

## 前置條件（手動操作，Claude 無法代做）

使用者需要自行完成：
1. 到 Supabase Dashboard → Project Settings → API → 複製 `service_role` key
2. 在 `apps/web/.env.local` 末尾加入：
   ```
   SUPABASE_SERVICE_ROLE_KEY=<你的 service_role key>
   ```
3. 重啟 `pnpm dev`

---

### Task 1: 新增 `createAdminClient()`

**Files:**
- Modify: `packages/api-client/src/client.ts`
- Modify: `packages/api-client/src/index.ts`

**Step 1: 在 `client.ts` 末尾加入 `createAdminClient`**

```typescript
/**
 * Server-only admin client — bypasses RLS via service_role key.
 * Sprint 0 only. Replace with createServerClient() + session after auth is implemented.
 *
 * NEVER call this from Client Components or expose the key to the browser.
 */
export function createAdminClient() {
  return supabaseServer(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

**Step 2: 確認 `index.ts` 有 export**

`packages/api-client/src/index.ts` 已有 `export * from './client'`，無需修改。

**Step 3: typecheck**

```bash
pnpm typecheck --filter @knoty/api-client
```
Expected: 0 errors

**Step 4: commit**

```bash
git add packages/api-client/src/client.ts
git commit -m "feat: add createAdminClient for Sprint 0 service_role bypass"
```

---

### Task 2: 串接首頁圈子列表

**Files:**
- Modify: `apps/web/app/page.tsx`

**背景：**
目前 `CIRCLES` 是寫死的 mock。Supabase 沒有 `unnest` + `GROUP BY` 的簡單 JS API，
改用 RPC 或多筆查詢。這裡用簡單方式：取全部 persons，在 JS 層 aggregate。

**Step 1: 將 `page.tsx` 改為 async Server Component，移除 mock CIRCLES**

在檔案頂部加 import：
```typescript
import { createAdminClient } from '@knoty/api-client';
```

把 `export default function HomePage()` 改為：
```typescript
export default async function HomePage() {
```

**Step 2: 在 component 開頭加資料查詢（圈子）**

```typescript
// ── 取所有人物，在 JS 層計算各圈子人數 ──────────────────────────────
const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99'; // Sprint 0
const supabase = createAdminClient();

const { data: persons } = await supabase
  .from('persons')
  .select('circles')
  .eq('user_id', HARDCODED_UID);

// 計算各圈子人數
const circleCountMap = new Map<string, number>();
for (const p of persons ?? []) {
  for (const c of p.circles ?? []) {
    circleCountMap.set(c, (circleCountMap.get(c) ?? 0) + 1);
  }
}
```

**Step 3: 圈子顏色 mapping（保留在頁面裡）**

```typescript
const CIRCLE_STYLES: Record<string, {
  emoji: string; bg: string; text: string; border: string; dot: string;
}> = {
  '社團':  { emoji: '🎭', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  '班上':  { emoji: '📚', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  '宿舍':  { emoji: '🏠', bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  '打工':  { emoji: '💼', bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
  '朋友圈':{ emoji: '🤝', bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500'   },
};
const DEFAULT_STYLE = { emoji: '⭕', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200', dot: 'bg-zinc-400' };
```

**Step 4: 把圈子列表 JSX 換成真實資料**

把 `{CIRCLES.map(...)}` 換成：

```tsx
{[...circleCountMap.entries()].map(([name, count]) => {
  const style = CIRCLE_STYLES[name] ?? DEFAULT_STYLE;
  return (
    <button
      key={name}
      className={`flex-none flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${style.bg} ${style.border} min-w-[80px] active:scale-95 transition-transform`}
    >
      <span className="text-2xl leading-none">{style.emoji}</span>
      <span className={`text-sm font-semibold ${style.text}`}>{name}</span>
      <span className="text-xs text-zinc-400 tabular-nums">{count} 人</span>
    </button>
  );
})}
```

**Step 5: 刪掉舊的 `const CIRCLES = [...]` block**

**Step 6: typecheck**

```bash
pnpm typecheck --filter web
```

**Step 7: 瀏覽器驗證**

打開 `http://localhost:3000`，圈子列表應顯示：
- 社團 3 人
- 班上 2 人
- 宿舍 1 人
- 打工 2 人
- 朋友圈 1 人（同事阿勳跨圈）

**Step 8: commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: connect homepage circles to Supabase persons"
```

---

### Task 3: 串接首頁事件 feed

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: 在 Task 2 的查詢後面，加 events 查詢**

```typescript
// ── 取最近 5 筆事件 + 涉及人物名稱 ──────────────────────────────────
const { data: events } = await supabase
  .from('events')
  .select('id, event_type, description, impact, occurred_at, involved_persons')
  .eq('user_id', HARDCODED_UID)
  .order('occurred_at', { ascending: false })
  .limit(5);

// 把所有 involved person UUIDs 收集起來，批次查名字
const allPersonIds = [...new Set(
  (events ?? []).flatMap((e: { involved_persons: string[] }) => e.involved_persons)
)];

const { data: involvedPersons } = allPersonIds.length > 0
  ? await supabase
      .from('persons')
      .select('id, display_name')
      .in('id', allPersonIds)
  : { data: [] };

const personNameMap = new Map(
  (involvedPersons ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name])
);
```

**Step 2: event_type → UI 樣式 mapping**

```typescript
const EVENT_STYLE: Record<string, {
  emoji: string; typeLabel: string;
  badgeBg: string; badgeText: string;
  cardBg: string; cardBorder: string;
}> = {
  favor:      { emoji: '🤝', typeLabel: '幫助',   badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', cardBg: 'bg-emerald-50', cardBorder: 'border-emerald-100' },
  conflict:   { emoji: '⚔️', typeLabel: '衝突',   badgeBg: 'bg-red-100',     badgeText: 'text-red-700',     cardBg: 'bg-red-50',     cardBorder: 'border-red-100'     },
  betrayal:   { emoji: '🗡️', typeLabel: '背刺',   badgeBg: 'bg-orange-100',  badgeText: 'text-orange-700',  cardBg: 'bg-orange-50',  cardBorder: 'border-orange-100'  },
  reconcile:  { emoji: '🕊️', typeLabel: '和解',   badgeBg: 'bg-sky-100',     badgeText: 'text-sky-700',     cardBg: 'bg-sky-50',     cardBorder: 'border-sky-100'     },
  milestone:  { emoji: '🏆', typeLabel: '里程碑', badgeBg: 'bg-amber-100',   badgeText: 'text-amber-700',   cardBg: 'bg-amber-50',   cardBorder: 'border-amber-100'   },
  note:       { emoji: '📝', typeLabel: '備忘',   badgeBg: 'bg-zinc-100',    badgeText: 'text-zinc-600',    cardBg: 'bg-white',      cardBorder: 'border-zinc-100'    },
};
```

**Step 3: 時間相對顯示 helper**

```typescript
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  return `${days} 天前`;
}
```

**Step 4: 把事件 feed JSX 換成真實資料**

把 `{MOCK_EVENTS.map(...)}` 換成：

```tsx
{(events ?? []).map((event: {
  id: string; event_type: string; description: string;
  impact: number; occurred_at: string; involved_persons: string[];
}) => {
  const style = EVENT_STYLE[event.event_type] ?? EVENT_STYLE.note;
  const names = event.involved_persons
    .map((id: string) => personNameMap.get(id) ?? '某人')
    .join('、');
  return (
    <div key={event.id} className={`rounded-2xl border p-4 ${style.cardBg} ${style.cardBorder}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
          {style.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-zinc-800">{names}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
              {style.typeLabel}
            </span>
            <ImpactBadge impact={event.impact} />
            <span className="text-xs text-zinc-400 ml-auto">
              {timeAgo(event.occurred_at)}
            </span>
          </div>
          <p className="text-sm text-zinc-600 leading-snug line-clamp-2">{event.description}</p>
        </div>
      </div>
    </div>
  );
})}
```

**Step 5: 刪掉 `const MOCK_EVENTS = [...]` block**

**Step 6: 刪掉首頁底部的「連接 Supabase 後…」佔位提示 div**

**Step 7: typecheck + 瀏覽器驗證**

```bash
pnpm typecheck --filter web
```

瀏覽器應顯示 5 筆真實事件：背刺（幹部小美）、幫助（社長學姐）等。

**Step 8: commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: connect homepage events feed to Supabase"
```

---

### Task 4: 串接圖譜頁

**Files:**
- Modify: `apps/web/app/graph/page.tsx`

**Step 1: 讀取現有 graph page**

先確認目前 `/graph` 頁面的 JSX 結構（3 個 mode toggle、inline SVG mockup）。

**Step 2: 改為 async Server Component，加 DB 查詢**

```typescript
import { createAdminClient } from '@knoty/api-client';

const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

export default async function GraphPage() {
  const supabase = createAdminClient();

  const [{ data: persons }, { data: relationships }] = await Promise.all([
    supabase
      .from('persons')
      .select('id, display_name, avatar_emoji, circles')
      .eq('user_id', HARDCODED_UID),
    supabase
      .from('relationships')
      .select('id, person_a, person_b, closeness, label, direction')
      .eq('user_id', HARDCODED_UID),
  ]);

  const nodeCount = persons?.length ?? 0;
  const edgeCount = relationships?.length ?? 0;
  // ...
```

**Step 3: 在現有 JSX 頂部加統計 banner**

在現有 mode toggle 的 header 下方插入：

```tsx
{/* DB 統計（Sprint 0 驗證用，Sprint 1 換 D3）*/}
<div className="mx-4 mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100 flex gap-6">
  <div className="text-center">
    <div className="text-2xl font-bold text-violet-700">{nodeCount}</div>
    <div className="text-xs text-zinc-500">人物節點</div>
  </div>
  <div className="w-px bg-violet-200" />
  <div className="text-center">
    <div className="text-2xl font-bold text-violet-700">{edgeCount}</div>
    <div className="text-xs text-zinc-500">關係邊</div>
  </div>
  <div className="w-px bg-violet-200" />
  <div className="text-center flex-1">
    <div className="text-xs text-zinc-400 mt-1">D3 圖譜</div>
    <div className="text-xs text-violet-600 font-medium">Sprint 1</div>
  </div>
</div>
```

**Step 4: 在統計下方加節點列表（為 D3 整合預留資料結構）**

```tsx
{/* 節點列表 — Sprint 1 會換成 D3 canvas */}
<div className="mx-4 mt-4 space-y-2">
  {(persons ?? []).map((p: {
    id: string; display_name: string; avatar_emoji: string; circles: string[];
  }) => (
    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-100">
      <span className="text-xl">{p.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-800">{p.display_name}</div>
        <div className="text-xs text-zinc-400">{p.circles?.join('・')}</div>
      </div>
    </div>
  ))}
</div>
```

**Step 5: typecheck + 瀏覽器驗證**

```bash
pnpm typecheck --filter web
```

`/graph` 應顯示：8 個節點、7 條關係，以及 8 張人物卡片。

**Step 6: commit**

```bash
git add apps/web/app/graph/page.tsx
git commit -m "feat: connect graph page to Supabase persons + relationships"
```

---

### Task 5: 新建 `/api/risk-check` Route Handler

**Files:**
- Create: `apps/web/app/api/risk-check/route.ts`

**Step 1: 建立 route handler**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@knoty/api-client';

const RequestSchema = z.object({
  from_id: z.string().uuid(),
  to_id:   z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { from_id, to_id } = parsed.data;

  if (from_id === to_id) {
    return NextResponse.json(
      { error: '請選擇兩個不同的人', code: 'SAME_PERSON' },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('find_relationship_paths', {
      p_from_id:   from_id,
      p_to_id:     to_id,
      p_max_depth: 3,
    });

    if (error) throw error;

    return NextResponse.json({
      paths:     data ?? [],
      pathCount: (data ?? []).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'DB_ERROR' },
      { status: 500 },
    );
  }
}
```

**Step 2: 安裝 zod（如果 apps/web 還沒有）**

先確認：
```bash
grep '"zod"' apps/web/package.json
```

如果沒有：
```bash
pnpm add zod --filter web
```

**Step 3: typecheck**

```bash
pnpm typecheck --filter web
```

**Step 4: 用 curl 測試（手動）**

在瀏覽器或 Postman，發送：
```
POST http://localhost:3000/api/risk-check
Content-Type: application/json

{
  "from_id": "b0000001-0000-0000-0000-000000000001",
  "to_id":   "b0000004-0000-0000-0000-000000000004"
}
```

預期：`{ "paths": [...], "pathCount": N }`

**Step 5: commit**

```bash
git add apps/web/app/api/risk-check/route.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add /api/risk-check route handler with find_relationship_paths"
```

---

### Task 6: 串接風險查詢頁

**Files:**
- Modify: `apps/web/app/risk/page.tsx`
- Create: `apps/web/components/risk-analyzer.tsx` (Client Component)

**Step 1: 讀取現有 risk page 結構**

確認目前 `/risk` 頁面的 JSX（兩個人物選擇器 + 分析按鈕）。

**Step 2: `risk/page.tsx` 改為 async Server Component**

```typescript
import { createAdminClient } from '@knoty/api-client';
import { RiskAnalyzer } from '@/components/risk-analyzer';

const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

export default async function RiskPage() {
  const supabase = createAdminClient();
  const { data: persons } = await supabase
    .from('persons')
    .select('id, display_name, avatar_emoji')
    .eq('user_id', HARDCODED_UID)
    .order('display_name');

  return (
    <main className="flex-1 pb-20">
      {/* header ... 保留現有 header JSX */}
      <RiskAnalyzer persons={persons ?? []} />
    </main>
  );
}
```

**Step 3: 建立 `RiskAnalyzer` Client Component**

```typescript
'use client';

import { useState } from 'react';

interface Person {
  id: string;
  display_name: string;
  avatar_emoji: string;
}

interface PathResult {
  path: string[];
  depth: number;
}

interface RiskAnalyzerProps {
  persons: Person[];
}

export function RiskAnalyzer({ persons }: RiskAnalyzerProps) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId]     = useState('');
  const [result, setResult] = useState<PathResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleAnalyze() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: fromId, to_id: toId }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const err = json as { error: string };
        setError(err.error ?? '查詢失敗');
      } else {
        const data = json as { paths: PathResult[]; pathCount: number };
        setResult(data.paths);
      }
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 space-y-5">
      {/* 人物 A 選擇 */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
          想聊天的對象
        </label>
        <select
          value={fromId}
          onChange={e => setFromId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">選擇一個人…</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>
              {p.avatar_emoji} {p.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 人物 B 選擇 */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
          要聊到的第三者
        </label>
        <select
          value={toId}
          onChange={e => setToId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">選擇一個人…</option>
          {persons.filter(p => p.id !== fromId).map(p => (
            <option key={p.id} value={p.id}>
              {p.avatar_emoji} {p.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 分析按鈕 */}
      <button
        onClick={handleAnalyze}
        disabled={!fromId || !toId || loading}
        className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        {loading ? '分析中…' : '🔍 分析關係路徑'}
      </button>

      {/* 錯誤訊息 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 查詢結果 */}
      {result !== null && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            找到 {result.length} 條關係路徑
          </p>
          {result.length === 0 ? (
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-500 text-center">
              這兩個人之間沒有關係路徑（3 度以內）
            </div>
          ) : (
            result.map((path, i) => (
              <div key={i} className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                <div className="text-xs text-violet-500 font-medium mb-1">路徑 {i + 1}（{path.depth} 度）</div>
                <div className="text-sm text-zinc-700 font-mono">
                  {Array.isArray(path.path) ? path.path.join(' → ') : JSON.stringify(path)}
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-zinc-400 text-center">
            Claude AI 風險分析 — Sprint 1 實作
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 4: 用現有 risk page header，移除 disabled 選擇器 JSX**

將 `risk/page.tsx` 裡的 static disabled 選擇器和按鈕全部換成 `<RiskAnalyzer persons={persons ?? []} />`。

**Step 5: typecheck + 瀏覽器驗證**

```bash
pnpm typecheck --filter web
```

`/risk` 頁面應：
- 顯示 8 個人物選項
- 選社長學姐 + 同學甲後點分析，顯示路徑（社長學姐 → 副社阿志 → 同學甲）

**Step 6: commit**

```bash
git add apps/web/app/risk/page.tsx apps/web/components/risk-analyzer.tsx
git commit -m "feat: connect risk page to Supabase with find_relationship_paths"
```

---

### Task 7: 最終驗證

**Step 1: 全部 typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors

**Step 2: 全部測試**

```bash
pnpm test
```

Expected: 9 passed (graph-engine tests)

**Step 3: 確認 4 個頁面**

| 頁面 | 預期 |
|------|------|
| `/` | 圈子卡片（社團 3 人⋯），5 筆事件 feed |
| `/graph` | 統計：8 節點、7 邊，8 張人物卡片 |
| `/risk` | 8 人選擇器，分析後顯示路徑 |
| `/record` | 不變（disabled） |

**Step 4: final commit**

```bash
git add -A
git commit -m "chore: Sprint 0 DB connection complete — all pages connected to Supabase"
```
