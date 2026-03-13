# DB 串接設計文件

**日期：** 2026-03-02
**階段：** Sprint 0

---

## 目標

將首頁、圖譜頁、風險查詢頁從靜態 mock 資料換成 Supabase 真實查詢。
記錄頁（/record）維持 disabled，不在本次範圍內。

---

## 決策

| 決策點 | 選擇 | 理由 |
|--------|------|------|
| Auth 策略 | service_role key 繞過 RLS | Sprint 0 先驗資料串通，auth 是 Sprint 1 |
| 資料抓取模式 | Server Components 直接查詢 | 最少程式碼，SSR，無額外 round trip |
| 風險查詢 | 新 API Route Handler | 需要動態參數，適合 Route Handler |

---

## 架構

### 新增 `createAdminClient()`

位置：`packages/api-client/src/client.ts`

```typescript
export function createAdminClient() {
  return supabaseServer(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- `SUPABASE_SERVICE_ROLE_KEY` 沒有 `NEXT_PUBLIC_` 前綴 → 不暴露給瀏覽器
- 只在 Server Components 和 Route Handlers 裡使用
- Sprint 1 加 auth 後，換回 `createServerClient()` + cookie session 即可

### 環境變數

`apps/web/.env.local` 新增：
```
SUPABASE_SERVICE_ROLE_KEY=<從 Supabase Dashboard → Project Settings → API 取得>
```

---

## 各頁面設計

### 首頁（`/`）

**圈子列表**
```sql
SELECT
  unnest(circles) AS circle_name,
  COUNT(*)        AS person_count
FROM persons
WHERE user_id = $uid
GROUP BY circle_name
ORDER BY person_count DESC;
```
結果對應 UI 的橫向捲動卡片，顏色 mapping 寫死在前端（社團=violet, 班上=blue, 宿舍=amber, 打工=emerald, 其他=zinc）。

**最近動態（events feed）**
```sql
SELECT
  e.id, e.event_type, e.description, e.impact, e.occurred_at,
  array_agg(p.display_name ORDER BY p.display_name) AS person_names
FROM events e
JOIN persons p ON p.id = ANY(e.involved_persons)
WHERE e.user_id = $uid
GROUP BY e.id
ORDER BY e.occurred_at DESC
LIMIT 5;
```
用 Supabase JS SDK 實作（`.from('events').select('..., persons!inner(...)')`）。

---

### 圖譜頁（`/graph`）

Sprint 0 只驗資料有進來，不做 D3 渲染（Sprint 1 再整合 KnotyGraphV3.jsx）。

**節點**
```sql
SELECT id, display_name, avatar_emoji, circles FROM persons WHERE user_id = $uid;
```

**邊**
```sql
SELECT id, person_a, person_b, closeness, label, direction FROM relationships WHERE user_id = $uid;
```

頁面顯示：節點數、邊數統計 + 節點列表卡片（為 D3 整合預留 props 結構）。

---

### 風險查詢頁（`/risk`）

**人物選擇器（Server Component）**
```sql
SELECT id, display_name, avatar_emoji FROM persons WHERE user_id = $uid ORDER BY display_name;
```

**分析查詢（新 Route Handler：`/api/risk-check`）**

`POST /api/risk-check`
```typescript
// Request body
{ from_id: string, to_id: string }

// 呼叫 DB function
SELECT * FROM find_relationship_paths($from_id, $to_id, 3);

// Response
{ paths: RelationPath[], pathCount: number }
```

Sprint 0 回傳原始路徑資料（不含 Claude 風險分析，那是 Sprint 1）。

---

## 修改檔案清單

| 檔案 | 變更類型 |
|------|---------|
| `apps/web/.env.local` | 手動新增 `SUPABASE_SERVICE_ROLE_KEY` |
| `packages/api-client/src/client.ts` | 新增 `createAdminClient()` |
| `apps/web/app/page.tsx` | async Server Component，替換 mock 資料 |
| `apps/web/app/graph/page.tsx` | async Server Component，顯示真實節點/邊 |
| `apps/web/app/risk/page.tsx` | async Server Component + 分析按鈕 Client Component |
| `apps/web/app/api/risk-check/route.ts` | 新建 Route Handler |

**不動：**
- `apps/web/app/record/page.tsx`
- 所有 migrations / schema

---

## 成功標準

- [ ] 首頁圈子卡片顯示真實人數（社團 3 人、班上 2 人…）
- [ ] 首頁最近動態顯示真實事件（幹部小美背刺、學姐幫忙…）
- [ ] 圖譜頁顯示「8 個節點、7 條關係」統計
- [ ] 風險查詢頁人物選擇器列出 8 個人
- [ ] 選兩個人點分析後顯示路徑結果

---

## 未來工作（不在本次範圍）

- Sprint 1：Supabase Auth 登入流程，換回 `createServerClient()` + session
- Sprint 1：D3 圖譜渲染（整合 KnotyGraphV3.jsx）
- Sprint 1：Claude Sonnet 風險分析 + Gemini Flash 事件解析
- Sprint 1：Record 頁面完整實作
