# PoC 3: Supabase Recursive CTE Latency — Design Spec

**Date:** 2026-03-16
**Sprint:** Sprint 0 Technical Validation
**Goal:** Verify `find_relationship_paths()` runs under 100ms with 200 nodes at depth 3.

---

## Context

`find_relationship_paths()` is a bidirectional BFS implemented as a PostgreSQL recursive CTE (migration 002). It accepts `p_user_id` explicitly, allowing admin-client calls without an auth session. This PoC measures whether the function meets the Sprint 0 latency target under realistic load.

**Pass condition:** Median RTT < 100ms across all test query types (200 nodes, depth 3).

---

## Measurement Architecture

Two independent layers:

**Layer 1 — DB internal time (Supabase Dashboard SQL Editor)**
- `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` wrapping the function call
- Reads `Execution Time: X.XXX ms` from the output
- Pass threshold: < 20ms (DB internal should be well under the 100ms total budget)

**Layer 2 — End-to-end RTT (Node.js)**
- `scripts/perf-test.ts` using `@supabase/supabase-js` with `service_role` key
- 5 runs per test case, median reported
- Pass threshold: median < 100ms

Separating the two layers allows diagnosis: if DB is fast but RTT is slow, the problem is network (Supabase region choice), not the query.

---

## Dataset Design

All perf data uses a fixed `PERF_USER_ID` UUID that does not exist in `auth.users`. The function accepts it via `p_user_id`. Cleanup is a single `DELETE WHERE user_id = PERF_USER_ID`.

**Topology (200 nodes, ~500 edges):**

| Circle | Nodes | Internal edges | Cross-circle edges |
|--------|-------|----------------|-------------------|
| 社團   | 50    | ~75            | ~25 to 班上        |
| 班上   | 50    | ~75            | ~25 to 宿舍        |
| 宿舍   | 50    | ~75            | ~25 to 打工        |
| 打工   | 50    | ~75            | ~25 to 社團        |

- Intra-circle closeness: 3–5
- Cross-circle closeness: 1–3
- Average degree: ~5 edges/node (sparse, realistic)

**Test query cases:**

| # | Description | Expected depth | Worst case? |
|---|-------------|----------------|-------------|
| 1 | Same-circle direct (adjacent nodes) | 1 | No |
| 2 | Cross-circle 2-hop (via 1 bridge node) | 2 | Moderate |
| 3 | Cross-circle 3-hop (社團 → 打工) | 3 | Yes |
| 4 | No path (isolated subgraph) | — | Yes (full scan) |

---

## File Structure

```
knoty/
├── supabase/
│   ├── perf_seed.sql          ← generates 200 nodes + ~500 edges
│   ├── perf_benchmark.sql     ← EXPLAIN ANALYZE queries for DB internal timing
│   └── perf_cleanup.sql       ← deletes all perf data
├── scripts/
│   ├── perf-test.ts           ← RTT benchmark (5 runs/case, median)
│   └── tsconfig.json          ← Node-targeted tsconfig (no DOM)
└── package.json               ← adds "perf": "tsx scripts/perf-test.ts"
```

---

## Execution Flow

```
Step 1  Dashboard SQL Editor → run perf_seed.sql
Step 2  Dashboard SQL Editor → run perf_benchmark.sql → record EXPLAIN ANALYZE times
Step 3  pnpm perf            → run scripts/perf-test.ts → record RTT results
Step 4  Dashboard SQL Editor → run perf_cleanup.sql
```

---

## Expected Output (scripts/perf-test.ts)

```
[Knoty PoC 3] Supabase CTE Latency Benchmark
─────────────────────────────────────────────
Dataset: 200 nodes, ~500 edges

Test 1: same-circle direct (depth 1)
  runs: 45ms 38ms 41ms 39ms 40ms
  median: 40ms  ✅ PASS

Test 2: cross-circle 2-hop
  runs: 52ms 49ms 55ms 51ms 48ms
  median: 51ms  ✅ PASS

Test 3: cross-circle 3-hop (worst case)
  runs: 88ms 91ms 85ms 90ms 87ms
  median: 88ms  ✅ PASS

Test 4: no path found
  runs: 72ms 68ms 75ms 70ms 71ms
  median: 71ms  ✅ PASS

─────────────────────────────────────────────
Overall: 4/4 PASS  🎉 Sprint 0 PoC 3 VERIFIED
```

---

## Failure Decision Tree

```
DB internal > 20ms
  → Add composite index on (user_id, person_a, person_b)
  → OR materialize common paths

RTT > 100ms but DB internal < 20ms
  → Network bottleneck — evaluate Supabase region
  → Consider connection pooling (pgBouncer already on Supabase)

RTT > 100ms AND DB internal > 20ms
  → Pre-compute frequent paths (materialized view / background job)
  → Reduce max_depth to 2 and surface "path unknown" UI state
```

---

## Dependencies

| Dependency | Source | Notes |
|-----------|--------|-------|
| `tsx` | root devDependency | Runs TypeScript scripts without build step |
| `@supabase/supabase-js` | already in api-client | Import directly in script |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` | Already required for web |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` | Server-side only, never client |

---

## Out of Scope

- Automated CI benchmark (Sprint 2+)
- Load testing with concurrent users
- Optimizations (materialized views, pre-compute) — only if PoC fails
