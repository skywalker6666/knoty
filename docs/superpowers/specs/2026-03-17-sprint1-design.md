# Sprint 1 Design — Knoty Web 功能

**Date:** 2026-03-17
**Status:** Approved
**Owner:** Alan
**Scope:** Production-ready web features for Sprint 1

---

## Overview

Sprint 1 completes the core Knoty web product: real authentication, full CRUD for the graph data model, a three-step onboarding flow, AI-powered quick record (Gemini Flash), and AI-powered risk analysis summaries (Claude Sonnet).

Sprint 0 established the infrastructure (monorepo, DB schema, graph visualization, CTE performance). Sprint 1 makes the product usable by a real user end-to-end.

---

## Execution Order (Approach A — Auth-First Sequential)

```
1. Supabase Auth        ← foundation (real user_id everywhere)
        ↓
2. CRUD API + UI        ← persons / relationships / events management
        ↓
3. Onboarding Flow      ← new user graph bootstrapping
        ↓
4. Quick Record (Gemini)← event parsing via natural language
        ↓
5. Risk Analysis (Claude)← AI summary layer on existing path query
```

---

## 1. Supabase Auth

### New Routes

| Route | Purpose |
|-------|---------|
| `app/login/page.tsx` | Login page with Supabase Auth UI |
| `app/auth/callback/route.ts` | OAuth code exchange + redirect logic |
| `middleware.ts` (root) | Session protection + refresh |

### Auth UI

- Package: `@supabase/auth-ui-react` + `@supabase/auth-ui-shared`
- Providers: Google OAuth + Email/Password
- Theme: custom Tailwind-based appearance object matching Knoty brand
- Locale: `zh-TW`

### Session Management

- Package: `@supabase/ssr`
- Server Components / API Routes: `createServerClient` reading from cookies
- Client Components: `createBrowserClient` (already in `@knoty/api-client`, add export)
- All API routes replace hardcoded UID with `supabase.auth.getUser()`

### Middleware (`middleware.ts`)

```typescript
// Protected: all routes except /login, /auth/callback, /api/health
// On unauthenticated request → redirect /login
// Refreshes session on every request (Supabase SSR requirement)
```

### Auth Callback Logic

```typescript
// app/auth/callback/route.ts
// 1. Exchange code for session
// 2. Count user's persons: SELECT count(*) FROM persons WHERE user_id = uid
// 3. count === 0 → redirect /onboarding
// 4. count > 0  → redirect /
```

### Files to Modify (hardcoded UID removal)

- `app/page.tsx`
- `app/risk/page.tsx`
- `app/graph/page.tsx`

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 2. CRUD API

### Conventions (every route)

1. Zod validation on request body
2. `supabase.auth.getUser()` → 401 `{ error: "Unauthorized", code: "AUTH_REQUIRED" }` if no session
3. RLS-protected anon client only (never service_role)
4. Error format: `{ error: string, code: string }`

### Persons

```
GET  /api/persons              → list all persons for authenticated user
POST /api/persons              → create person

GET    /api/persons/[id]       → single person with relationships
PATCH  /api/persons/[id]       → update fields
DELETE /api/persons/[id]       → hard delete (cascades relationships via FK)
```

**POST /api/persons request schema (Zod):**
```typescript
{
  nickname: string,         // required, max 50 chars
  circle_id?: string,       // uuid of circle_template
  closeness?: number,       // 1–5, default 3
  notes?: string,           // max 500 chars
}
```

### Relationships

```
GET  /api/relationships           → list, optional ?person_id= filter
POST /api/relationships           → create

PATCH  /api/relationships/[id]    → update closeness / relation_type / direction
DELETE /api/relationships/[id]    → delete
```

**POST /api/relationships request schema (Zod):**
```typescript
{
  person_a_id: string,      // uuid — app layer sorts a < b before sending
  person_b_id: string,      // uuid
  closeness?: number,       // 1–5, default 3
  relation_type?: string,   // max 50 chars
  direction?: "mutual" | "a_to_b" | "b_to_a",  // default "mutual"
}
```

Server enforces `person_a < person_b` ordering (lexicographic UUID comparison) regardless of client input.

### Events

```
GET  /api/events               → list, optional ?person_id= filter, default latest 20
POST /api/events               → create

PATCH  /api/events/[id]        → update
DELETE /api/events/[id]        → delete
```

**POST /api/events request schema (Zod):**
```typescript
{
  involved_person_ids: string[],   // uuid[]
  event_type: "conflict" | "favor" | "betrayal" | "reconcile" | "milestone" | "note",
  description: string,             // max 500 chars
  impact: number,                  // -3 to +3
  occurred_at?: string,            // ISO 8601, default now()
}
```

### CRUD UI

No new pages. Use **shadcn/ui Sheet** (side panel) pattern:

- Home page person cards → tap → Sheet opens with person detail + edit/delete actions
- Home page top-right `＋` button → Sheet opens for new person
- Relationship management inside person detail Sheet (list + add/remove)
- Optimistic updates with `useSWR` or React Query for instant feedback

---

## 3. Onboarding Flow

### Route

`app/onboarding/page.tsx` — 3-step wizard, client component with local state.

### Trigger

Auth callback: if `persons count === 0` → redirect `/onboarding`.

Once onboarding is complete (any persons exist), this route is no longer triggered.

### Step 1 — Select Template

- Fetch `GET /api/templates` (system templates where `is_system = true`)
- Display as selectable cards: 大學班級, 社團, 宿舍, 打工, 自訂（空白）
- Multi-select allowed
- CTA: 「下一步」(disabled until ≥1 template selected)

### Step 2 — Review Persons

- Based on selected templates, show suggested person placeholders (e.g. 「室友1、室友2、室友3」)
- Each row: nickname input field + delete button
- Add row button for extra persons
- Only field required: nickname (max 50 chars)
- CTA: 「下一步」(disabled until ≥1 person with non-empty nickname)

### Step 3 — Set Relationship Strength

- Show person pairs derived from template's default relationships
- Each pair: avatar initials + closeness slider (1–5, labeled 陌生→超熟)
- Skip allowed (defaults to closeness = 3)
- CTA: 「完成建立」→ POST /api/onboarding → redirect `/`

### `/api/templates` Endpoint

```
GET /api/templates
→ system templates (is_system = true) + user's custom templates
→ [{ id, name, description, suggested_persons: string[], default_pairs: [idx, idx][] }]
```

### `/api/onboarding` Endpoint

```typescript
// POST — Zod validated
{
  persons: { nickname: string, circle_id?: string }[],
  relationships: {
    person_a_idx: number,   // index into persons array
    person_b_idx: number,
    closeness: number,      // 1–5
  }[]
}

// Server generates UUIDs, batch inserts persons then relationships
// Enforces person_a < person_b ordering on UUID after generation

// Response
{ created: { persons: number, relationships: number } }
```

---

## 4. Quick Record — Gemini Flash Event Parsing

### User Flow

```
/record → type sentence → press "解析" → see structured preview → confirm/edit → press "儲存" → POST /api/events → back to /
```

### `/api/events/parse` Endpoint

```typescript
// POST { text: string }  (Zod: max 200 chars)
// Server calls Gemini Flash with structured output prompt
// Response:
{
  involved_persons: string[],     // nicknames, fuzzy-matched against user's DB persons
  matched_person_ids: string[],   // resolved UUIDs (null entry if no match)
  event_type: "conflict" | "favor" | "betrayal" | "reconcile" | "milestone" | "note",
  description: string,
  impact: number,                  // -3 to +3
  occurred_at: string,             // ISO 8601
}
```

**Gemini prompt rules:**
- Ambiguous → `event_type: "note"`, `impact: 0`
- Ambiguous date → today's date
- Output must be valid JSON matching the schema above

**Person matching:**
- Server does `WHERE nickname ILIKE '%<name>%' AND user_id = uid` for each extracted name
- Unmatched names returned as-is with `matched_person_ids[i] = null`

**Environment variable:** `GEMINI_API_KEY` (server-side only)

### UI (`app/record/page.tsx` rewrite)

- Large textarea (placeholder: 「輸入今天發生的事，例如：小明幫我帶午餐，感覺我們更近了」)
- 「解析」button → loading spinner → result preview card appears
- Preview card shows: event_type badge, impact color bar (-3 red → +3 green), involved persons tags
- Inline edit: event_type dropdown, impact slider on preview card
- Unmatched person → yellow warning tag 「找不到此人，要新增嗎？」→ quick-add inline
- Error (Gemini failure) → toast error + expand manual form (all fields visible)
- 「儲存」button → POST /api/events → success toast → redirect `/`

---

## 5. Risk Analysis — Claude Sonnet AI Summary

### Existing Foundation

`/api/risk-check` already calls `find_relationship_paths()` and returns path data. Sprint 1 adds a Claude Sonnet call after path retrieval.

### Updated Response Schema

```typescript
{
  // existing path data (unchanged)...
  ai: {
    riskLevel: "low" | "medium" | "high",
    summary: string,     // ≤ 150 chars, 繁體中文
    suggestion: string,  // ≤ 150 chars, 繁體中文
  } | null
  aiLimitReached?: boolean  // true when free user exhausted monthly quota
}
```

### Claude Call Rules

- If `paths.length === 0` (no connection found) → skip Claude call, return `ai: null`
- Format path data as structured context in prompt: person nicknames, relation_type, closeness, recent event descriptions
- Response constraints: 繁體中文, no moral judgements, no decisions for user, analysis + suggestions only, total ≤ 300 chars

### Usage Limit

New table: `ai_usage`
```sql
CREATE TABLE ai_usage (
  user_id  uuid REFERENCES auth.users NOT NULL,
  month    char(7) NOT NULL,   -- 'YYYY-MM'
  count    integer DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
```

Logic:
1. Check `count` for current month
2. If `count >= 5` and `SKIP_AI_LIMIT != "true"` → return `ai: null, aiLimitReached: true`
3. Else → call Claude, then `UPSERT ai_usage ... count = count + 1`

**Environment variable:** `ANTHROPIC_API_KEY` (server-side only), `SKIP_AI_LIMIT` (dev flag)

### UI (`app/risk/page.tsx` modifications)

- Existing path visualization unchanged
- Below paths: AI summary card (loads async, independent skeleton)
- riskLevel badge: 低風險 (green) / 中風險 (amber) / 高風險 (red)
- summary + suggestion in two paragraphs
- Limit reached state: 「本月免費分析次數已用完」+ dummy Pro upgrade CTA button
- AI card only renders when paths exist (no connection → show「兩人目前無連結，無法進行風險分析」)

---

## Error Handling Standards

All API routes return structured errors:

| Scenario | HTTP | `code` |
|----------|------|--------|
| No session | 401 | `AUTH_REQUIRED` |
| Zod validation fail | 400 | `VALIDATION_ERROR` |
| Resource not found | 404 | `NOT_FOUND` |
| RLS rejection (wrong user) | 403 | `FORBIDDEN` |
| Gemini API failure | 502 | `GEMINI_ERROR` |
| Claude API failure | 502 | `CLAUDE_ERROR` |
| DB error | 500 | `DB_ERROR` |

---

## Testing

- API routes: Vitest unit tests in `app/api/**/__tests__/`
- Test each route: success case, auth failure (401), validation failure (400), not-found (404)
- Graph engine: existing tests remain; no new graph-engine changes in Sprint 1
- Gemini / Claude: mock API responses in tests (no real API calls in CI)
- Components: React Testing Library for Onboarding wizard step transitions

---

## Out of Scope (Sprint 1)

- iOS / React Native — Sprint 0 PoC 1 (NotificationListenerService) not yet complete
- Pro subscription / payment — `SKIP_AI_LIMIT` flag used instead
- Soft delete / data export — Phase 1
- E2E tests (Playwright) — Phase 2
- Push notifications — Phase 2
