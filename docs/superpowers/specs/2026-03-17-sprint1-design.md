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
```

**GET /api/persons list response schema:**
```typescript
{
  persons: {
    id: string,
    display_name: string,
    avatar_emoji: string | null,
    circles: string[],
    tags: string[],
    notes: string | null,
    created_at: string,
    updated_at: string,
  }[]
}
```

```

GET    /api/persons/[id]       → single person with relationships
PATCH  /api/persons/[id]       → update fields
DELETE /api/persons/[id]       → hard delete (cascades relationships via FK)
```

**POST /api/persons request schema (Zod):**
```typescript
{
  display_name: string,     // required, max 100 chars (DB column name)
  avatar_emoji?: string,    // single emoji, max 10 chars
  circles?: string[],       // circle names, e.g. ["社團", "班上"] — maps to DB circles TEXT[]
  tags?: string[],          // custom tags, e.g. ["值得信任"]
  notes?: string,           // max 500 chars
}
```

**GET /api/persons/[id] response schema:**
```typescript
{
  id: string,
  display_name: string,
  avatar_emoji: string | null,
  circles: string[],
  tags: string[],
  notes: string | null,
  created_at: string,
  updated_at: string,
  relationships: {          // embedded, from relationships table
    id: string,
    other_person_id: string,
    other_person_name: string,
    closeness: number,
    label: string | null,
    direction: "mutual" | "a_to_b" | "b_to_a",
  }[]
}
```

**DELETE /api/persons/[id] — orphaned events note:**
Deleting a person cascades to `relationships` (FK ON DELETE CASCADE). However, `events.involved_persons` is a `UUID[]` array column with no FK — the deleted UUID will remain in existing events rows. The DELETE handler must additionally run:
```sql
UPDATE events
SET involved_persons = array_remove(involved_persons, $personId::uuid)
WHERE user_id = $userId AND $personId::uuid = ANY(involved_persons);
-- Then delete events left with empty involved_persons array:
DELETE FROM events WHERE user_id = $userId AND array_length(involved_persons, 1) IS NULL;
```

### Relationships

```
GET  /api/relationships           → list, optional ?person_id= filter
POST /api/relationships           → create
```

**GET /api/relationships list response schema:**
```typescript
{
  relationships: {
    id: string,
    person_a: string,        // UUID
    person_b: string,        // UUID
    closeness: number,
    label: string | null,
    direction: "mutual" | "a_to_b" | "b_to_a",
    context: string | null,
    notes: string | null,
    created_at: string,
    updated_at: string,
  }[]
}
```

```

PATCH  /api/relationships/[id]    → update closeness / label / direction
DELETE /api/relationships/[id]    → delete
```

**POST /api/relationships request schema (Zod):**
```typescript
{
  person_a: string,         // uuid — DB column name is person_a (no _id suffix)
  person_b: string,         // uuid — DB column name is person_b
  closeness?: number,       // 1–5, default 3
  label?: string,           // DB column is `label`, max 50 chars (e.g. "同盟", "競爭")
  direction?: "mutual" | "a_to_b" | "b_to_a",  // default "mutual"
  context?: string,         // circle context e.g. "職場", max 50 chars
}
```

Server enforces `person_a < person_b` ordering (lexicographic UUID comparison) regardless of client input.

**PATCH /api/relationships/[id] updatable fields:** `closeness`, `label`, `direction`, `context`, `notes`

### Events

```
GET  /api/events               → list, optional ?person_id= filter, default latest 20
POST /api/events               → create
```

**GET /api/events list response schema:**
```typescript
{
  events: {
    id: string,
    involved_persons: string[],    // UUID[] — DB column name
    event_type: string,
    description: string,
    impact: number,
    occurred_at: string,           // DATE as ISO string
    created_at: string,
  }[]
}
```

```

PATCH  /api/events/[id]        → update
DELETE /api/events/[id]        → delete
```

**POST /api/events request schema (Zod):**
```typescript
{
  involved_person_ids: string[],   // request alias — server maps to DB column `involved_persons UUID[]`
  event_type: "conflict" | "favor" | "betrayal" | "reconcile" | "milestone" | "note",
  description: string,             // max 500 chars
  impact: number,                  // -3 to +3
  occurred_at?: string,            // ISO 8601 date string, default today; server converts to DATE
}
```

**Note on events.updated_at:** The `events` table has no `updated_at` column (unlike `persons` and `relationships`). `PATCH /api/events/[id]` is still valid — rows can be updated. The PATCH response simply omits `updated_at`. Do not add `updated_at` to the response schema.

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
- Only field required: nickname (max 100 chars — matches `display_name VARCHAR(100)` DB constraint)
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
→ Response: [{
     id: string,
     name: string,
     description: string | null,
     preset_roles: string[],   // DB column name — role suggestions e.g. ["室友1", "室友2"]
     preset_labels: string[],  // DB column name — relationship labels e.g. ["同盟", "競爭"]
   }]
```

The frontend derives `suggested_persons` from `preset_roles` (use as placeholder nicknames in Step 2) and `default_pairs` from adjacent pairs in `preset_roles` (each consecutive pair gets a default relationship with `label` from `preset_labels[0]`).

### `/api/onboarding` Endpoint

```typescript
// POST — Zod validated
{
  persons: { display_name: string, circles?: string[] }[],  // display_name maps to DB column
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
  matched_person_ids: (string | null)[],  // resolved UUIDs; null if no DB match found
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
- Server does `WHERE display_name ILIKE '%<name>%' AND user_id = uid` for each extracted name (DB column is `display_name`, not `nickname`)
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

**Critical migration required:** The current `route.ts` uses `createAdminClient` (service_role key, bypasses RLS) with a hardcoded UID. Sprint 1 must switch to `createServerClient` (anon key + cookies) so that `auth.uid()` resolves correctly inside the CTE's `WHERE user_id = auth.uid()` clause. Replacing only the UID without swapping the client type will silently return all users' data.

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

New table defined in migration `002_ai_usage.sql`:

```sql
-- UP
CREATE TABLE ai_usage (
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month    char(7) NOT NULL,   -- 'YYYY-MM'
  count    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own usage rows
CREATE POLICY ai_usage_select ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_usage_insert ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ai_usage_update ON ai_usage
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No DELETE policy: usage rows are append-only; users cannot delete their own usage history
-- (prevents gaming the monthly quota by deleting rows)

-- DOWN
-- DROP TABLE IF EXISTS ai_usage CASCADE;
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
