# Monorepo Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Turborepo + pnpm workspaces skeleton that lets all packages compile and reference each other.

**Architecture:** Root config → packages (shared, graph-engine, api-client) → apps/web via create-next-app → apps/mobile placeholder. Internal packages export TypeScript source directly (no build step), apps consume them via workspace protocol.

**Tech Stack:** Turborepo 2, pnpm 9, TypeScript 5.7, Next.js 15, Tailwind CSS, @supabase/ssr, Vitest 2

---

## Task 1: Root config files

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`

**Step 1: Create root package.json**

```json
{
  "name": "knoty",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev":       "turbo dev",
    "build":     "turbo build",
    "typecheck": "turbo typecheck",
    "lint":      "turbo lint",
    "test":      "turbo test"
  },
  "devDependencies": {
    "turbo":      "^2.0.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json
git commit -m "chore: add root monorepo config (turbo, pnpm workspaces, tsconfig base)"
```

---

## Task 2: packages/shared config

`types.ts` already exists. Wire up the package config and re-export.

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

**Step 1: Create packages/shared/package.json**

```json
{
  "name": "@knoty/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/shared/src/index.ts**

```typescript
export * from './types';
```

**Step 4: Typecheck**

```bash
cd packages/shared && pnpm typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/shared/
git commit -m "chore: wire up @knoty/shared package config"
```

---

## Task 3: packages/graph-engine — config + path-finder

**Files:**
- Create: `packages/graph-engine/package.json`
- Create: `packages/graph-engine/tsconfig.json`
- Create: `packages/graph-engine/vitest.config.ts`
- Create: `packages/graph-engine/src/__tests__/path-finder.test.ts`
- Create: `packages/graph-engine/src/path-finder.ts`
- Create: `packages/graph-engine/src/index.ts`

**Step 1: Create packages/graph-engine/package.json**

```json
{
  "name": "@knoty/graph-engine",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test":      "vitest run"
  },
  "dependencies": {
    "@knoty/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest":     "^2.0.0"
  }
}
```

**Step 2: Create packages/graph-engine/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/graph-engine/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
});
```

**Step 4: Write failing tests**

Create `packages/graph-engine/src/__tests__/path-finder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeEdge, buildAdjacencyList } from '../path-finder';
import type { Relationship } from '@knoty/shared';

// UUIDs sorted so A < B lexicographically
const UUID_A = '00000000-0000-0000-0000-000000000001';
const UUID_B = '00000000-0000-0000-0000-000000000002';
const UUID_C = '00000000-0000-0000-0000-000000000003';

describe('normalizeEdge', () => {
  it('returns as-is when from < to', () => {
    const result = normalizeEdge(UUID_A, UUID_B, 'mutual');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'mutual' });
  });

  it('swaps IDs when from > to', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'mutual');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'mutual' });
  });

  it('flips a_to_b to b_to_a when IDs are swapped', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'a_to_b');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'b_to_a' });
  });

  it('flips b_to_a to a_to_b when IDs are swapped', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'b_to_a');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'a_to_b' });
  });

  it('defaults direction to mutual', () => {
    const result = normalizeEdge(UUID_A, UUID_B);
    expect(result.direction).toBe('mutual');
  });
});

describe('buildAdjacencyList', () => {
  const rel: Relationship = {
    id: 'r1',
    userId: 'user1',
    personA: UUID_A,
    personB: UUID_B,
    closeness: 4,
    direction: 'a_to_b',
    createdAt: '',
    updatedAt: '',
  };

  it('creates entries for both persons', () => {
    const map = buildAdjacencyList([rel]);
    expect(map.has(UUID_A)).toBe(true);
    expect(map.has(UUID_B)).toBe(true);
  });

  it('A neighbours include B with original direction', () => {
    const map = buildAdjacencyList([rel]);
    const aNeighbours = map.get(UUID_A)!;
    expect(aNeighbours).toHaveLength(1);
    expect(aNeighbours[0]).toMatchObject({ personId: UUID_B, closeness: 4, direction: 'a_to_b' });
  });

  it('B neighbours include A with flipped direction', () => {
    const map = buildAdjacencyList([rel]);
    const bNeighbours = map.get(UUID_B)!;
    expect(bNeighbours).toHaveLength(1);
    expect(bNeighbours[0]).toMatchObject({ personId: UUID_A, closeness: 4, direction: 'b_to_a' });
  });

  it('aggregates multiple relationships correctly', () => {
    const rel2: Relationship = {
      id: 'r2', userId: 'user1',
      personA: UUID_A, personB: UUID_C,
      closeness: 2, direction: 'mutual',
      createdAt: '', updatedAt: '',
    };
    const map = buildAdjacencyList([rel, rel2]);
    expect(map.get(UUID_A)).toHaveLength(2);
    expect(map.get(UUID_B)).toHaveLength(1);
    expect(map.get(UUID_C)).toHaveLength(1);
  });
});
```

**Step 5: Run tests — expect FAIL**

```bash
cd packages/graph-engine && pnpm install && pnpm test
```

Expected: FAIL — `Cannot find module '../path-finder'`

**Step 6: Implement path-finder.ts**

Create `packages/graph-engine/src/path-finder.ts`:

```typescript
import type { Relationship, RelationDirection, Closeness } from '@knoty/shared';

// ── normalizeEdge ─────────────────────────────────────────────────────────────

export interface NormalizedEdge {
  personA: string;         // guaranteed < personB (matches DB CHECK constraint)
  personB: string;
  direction: RelationDirection;
}

/**
 * Ensures personA < personB, matching the DB CHECK(person_a < person_b) constraint.
 * Flips direction semantics when IDs are swapped.
 *
 * Call this before every INSERT into the relationships table.
 */
export function normalizeEdge(
  from: string,
  to: string,
  direction: RelationDirection = 'mutual',
): NormalizedEdge {
  if (from < to) {
    return { personA: from, personB: to, direction };
  }
  const flipped: RelationDirection =
    direction === 'a_to_b' ? 'b_to_a' :
    direction === 'b_to_a' ? 'a_to_b' :
    'mutual';
  return { personA: to, personB: from, direction: flipped };
}

// ── buildAdjacencyList ────────────────────────────────────────────────────────

export interface Neighbour {
  personId: string;
  closeness: Closeness;
  direction: RelationDirection;
  context?: string;
}

/**
 * Builds a bidirectional adjacency list from a flat relationship array.
 * Used for client-side graph operations (D3 layout, local path preview).
 * Server-side path finding uses find_relationship_paths() SQL function.
 */
export function buildAdjacencyList(
  relationships: Relationship[],
): Map<string, Neighbour[]> {
  const map = new Map<string, Neighbour[]>();

  for (const rel of relationships) {
    // personA → personB
    if (!map.has(rel.personA)) map.set(rel.personA, []);
    map.get(rel.personA)!.push({
      personId:  rel.personB,
      closeness: rel.closeness,
      direction: rel.direction,
      context:   rel.context,
    });

    // personB → personA (flip direction for reverse traversal)
    if (!map.has(rel.personB)) map.set(rel.personB, []);
    const flipped: RelationDirection =
      rel.direction === 'a_to_b' ? 'b_to_a' :
      rel.direction === 'b_to_a' ? 'a_to_b' :
      'mutual';
    map.get(rel.personB)!.push({
      personId:  rel.personA,
      closeness: rel.closeness,
      direction: flipped,
      context:   rel.context,
    });
  }

  return map;
}
```

**Step 7: Create packages/graph-engine/src/index.ts**

```typescript
export { normalizeEdge, buildAdjacencyList } from './path-finder';
export type { NormalizedEdge, Neighbour } from './path-finder';
```

**Step 8: Run tests — expect PASS**

```bash
pnpm test
```

Expected: all 9 tests PASS.

**Step 9: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

**Step 10: Commit**

```bash
git add packages/graph-engine/
git commit -m "feat: add @knoty/graph-engine with normalizeEdge and buildAdjacencyList"
```

---

## Task 4: packages/api-client — config + Supabase client

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/index.ts`

**Step 1: Create packages/api-client/package.json**

```json
{
  "name": "@knoty/api-client",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@knoty/shared":          "workspace:*",
    "@supabase/supabase-js":  "^2.47.0",
    "@supabase/ssr":          "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create packages/api-client/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/api-client/src/client.ts**

```typescript
import {
  createBrowserClient as supabaseBrowser,
  createServerClient as supabaseServer,
  type CookieOptions,
} from '@supabase/ssr';

const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
};

/**
 * For Next.js Client Components and React Native.
 * Creates a new Supabase client on every call — safe to call inside components.
 */
export function createBrowserClient() {
  return supabaseBrowser(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );
}

/**
 * Cookie store interface — matches Next.js `cookies()` return type.
 * Pass the `cookies()` result from `next/headers` directly.
 */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  delete(name: string, options: CookieOptions): void;
}

/**
 * For Next.js Server Components and API Routes.
 * Reads/writes auth cookies via the provided cookie store.
 *
 * Usage (Server Component):
 *   import { cookies } from 'next/headers';
 *   const supabase = createServerClient(cookies());
 */
export function createServerClient(cookieStore: CookieStore) {
  return supabaseServer(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name)              { return cookieStore.get(name)?.value; },
        set(name, value, opts) { cookieStore.set(name, value, opts); },
        remove(name, opts)     { cookieStore.delete(name, opts); },
      },
    },
  );
}
```

**Step 4: Create packages/api-client/src/index.ts**

```typescript
export { createBrowserClient, createServerClient } from './client';
export type { CookieStore } from './client';
```

**Step 5: Install and typecheck**

```bash
cd packages/api-client && pnpm install && pnpm typecheck
```

Expected: no errors.

**Step 6: Commit**

```bash
git add packages/api-client/
git commit -m "feat: add @knoty/api-client with Supabase browser and server clients"
```

---

## Task 5: apps/web — Next.js scaffold

**Step 1: Run create-next-app**

Run from the repo root:

```bash
pnpm create next-app@latest apps/web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git \
  --eslint
```

When prompted (if interactive): accept all defaults.

**Step 2: Add internal package dependencies**

Edit `apps/web/package.json` — add to `"dependencies"`:

```json
"@knoty/shared":      "workspace:*",
"@knoty/api-client":  "workspace:*",
"@knoty/graph-engine": "workspace:*"
```

**Step 3: Fix apps/web/tsconfig.json to extend base**

Replace the contents of `apps/web/tsconfig.json` with:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: Add typecheck script**

In `apps/web/package.json`, ensure scripts contains:

```json
"typecheck": "tsc --noEmit"
```

**Step 5: Install from root**

```bash
cd ../../  # back to repo root
pnpm install
```

Expected: all workspace packages linked correctly.

**Step 6: Typecheck web**

```bash
pnpm --filter web typecheck
```

Expected: no errors (Next.js may show a few `next-env.d.ts` warnings — these are normal until `pnpm dev` is run once).

**Step 7: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold apps/web with Next.js App Router, Tailwind, TypeScript"
```

---

## Task 6: apps/mobile placeholder

**Files:**
- Create: `apps/mobile/package.json`

**Step 1: Create apps/mobile/package.json**

```json
{
  "name": "@knoty/mobile",
  "version": "0.0.0",
  "private": true,
  "description": "React Native Android-first app — scaffold in Sprint 1"
}
```

**Step 2: Commit**

```bash
git add apps/mobile/
git commit -m "chore: add apps/mobile placeholder (Sprint 1)"
```

---

## Task 7: Full workspace verification

**Step 1: Install all dependencies from root**

```bash
pnpm install
```

Expected: lockfile updated, all workspace packages resolved.

**Step 2: Typecheck all packages**

```bash
pnpm typecheck
```

Expected: `@knoty/shared`, `@knoty/graph-engine`, `@knoty/api-client`, `web` all pass.

**Step 3: Run all tests**

```bash
pnpm test
```

Expected: `@knoty/graph-engine` — 9 tests PASS. Other packages — no test runner configured yet (skip).

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: verify full workspace — typecheck and tests green"
```

---

## Done

After all tasks pass, the monorepo skeleton is complete:
- `pnpm dev` starts Next.js + any future packages
- `pnpm typecheck` validates all packages
- `pnpm test` runs graph-engine tests
- Internal packages import each other via `@knoty/*` workspace protocol
