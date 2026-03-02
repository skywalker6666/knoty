# Knoty Monorepo Skeleton — Design Doc

**Date:** 2026-03-02
**Status:** Approved

---

## Scope

Build the Turborepo + pnpm workspaces monorepo skeleton that unblocks all subsequent development.

**In scope:**
- Root config (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
- `apps/web` — full Next.js App Router scaffold via create-next-app (TypeScript + Tailwind)
- `apps/mobile` — placeholder package.json only (Sprint 1)
- `packages/shared` — config files around existing types.ts
- `packages/graph-engine` — config + basic path-finder implementation
- `packages/api-client` — config + Supabase client initialisation

**Out of scope:**
- React Native full scaffold (Sprint 1)
- shadcn/ui component setup (next task after skeleton)
- Vitest / test runner config (separate task)
- CI/CD pipeline

---

## Approach

**Hybrid**: `create-next-app` for apps/web, manual files for everything else.

Rationale: Next.js + Tailwind boilerplate is complex and version-sensitive; the official CLI produces the most correct output. Root config and packages need precise control that manual authoring provides better.

---

## File Tree

```
knoty/
├── package.json              private root, pnpm workspaces
├── pnpm-workspace.yaml       apps/*, packages/*
├── turbo.json                pipelines: build, dev, typecheck, lint, test
├── tsconfig.base.json        strict: true, shared compiler options
│
├── apps/
│   ├── web/                  create-next-app output
│   │   ├── package.json      deps: @knoty/shared, @knoty/api-client
│   │   └── tsconfig.json     extends ../../tsconfig.base.json
│   └── mobile/
│       └── package.json      stub, name: @knoty/mobile
│
├── packages/
│   ├── shared/
│   │   ├── package.json      name: @knoty/shared, exports: ./src/index.ts
│   │   ├── tsconfig.json     extends ../../tsconfig.base.json
│   │   └── src/
│   │       ├── index.ts      re-exports from types.ts
│   │       └── types.ts      (already exists)
│   │
│   ├── graph-engine/
│   │   ├── package.json      name: @knoty/graph-engine, dep: @knoty/shared
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      exports normalizeEdge, buildAdjacencyList
│   │       └── path-finder.ts  normalizeEdge() + buildAdjacencyList()
│   │
│   └── api-client/
│       ├── package.json      name: @knoty/api-client, dep: @supabase/supabase-js
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      exports createBrowserClient, createServerClient
│           └── client.ts     Supabase client factory functions
│
└── supabase/                 (already exists)
```

---

## Key Decisions

### TypeScript config layering
- `tsconfig.base.json` at root: `strict: true`, `target: ES2022`, `moduleResolution: bundler`
- Each package/app extends base and adds only what it needs (e.g., web adds Next.js plugin)

### Package naming
- All internal packages use `@knoty/` scope
- `"private": true` on all packages (not published to npm)

### Turbo pipeline
- `build` depends on upstream `build` (packages build before apps)
- `dev` runs all in parallel (no dependency)
- `typecheck` and `lint` are independent per package

### graph-engine baseline
- `normalizeEdge(a, b, direction)` — ensures UUID order matches DB CHECK(person_a < person_b), flips direction if needed
- `buildAdjacencyList(relationships)` — Map<personId, neighbour[]> for client-side graph ops

### api-client baseline
- `createBrowserClient()` — for Next.js Client Components and React Native
- `createServerClient(cookieStore)` — for Next.js Server Components / API Routes
- Uses `@supabase/ssr` package (recommended pattern for Next.js App Router)
