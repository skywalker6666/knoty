-- ============================================================
-- Knoty — perf_benchmark.sql
-- PoC 3: DB-internal timing via EXPLAIN ANALYZE
--
-- Run in: Supabase Dashboard → SQL Editor (after perf_seed.sql)
-- Read "Execution Time: X.XXX ms" from each result.
-- Pass threshold: < 20ms per query.
--
-- Uses migration 002's 4-parameter signature:
--   find_relationship_paths(p_from_id, p_to_id, p_max_depth, p_user_id)
-- p_user_id bypasses auth.uid() (which returns NULL in Dashboard context).
-- ============================================================

-- Test 1: Same-circle direct connection (depth 1)
-- Path: 社團/1 → 社團/2
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM find_relationship_paths(
  'f0000001-0000-0000-0000-000000000001'::UUID,  -- 社團/1
  'f0000001-0000-0000-0000-000000000002'::UUID,  -- 社團/2
  3,
  'f0000000-0000-0000-0000-000000000000'::UUID   -- PERF_USER_ID
);

-- Test 2: Cross-circle 2-hop
-- Path: 社團/1 → 社團/2 → 班上/1
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM find_relationship_paths(
  'f0000001-0000-0000-0000-000000000001'::UUID,  -- 社團/1
  'f0000002-0000-0000-0000-000000000001'::UUID,  -- 班上/1
  3,
  'f0000000-0000-0000-0000-000000000000'::UUID
);

-- Test 3: Cross-circle 3-hop (worst case)
-- Path: 社團/1 → 社團/2 → 班上/1 → 宿舍/1
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM find_relationship_paths(
  'f0000001-0000-0000-0000-000000000001'::UUID,  -- 社團/1
  'f0000003-0000-0000-0000-000000000001'::UUID,  -- 宿舍/1
  3,
  'f0000000-0000-0000-0000-000000000000'::UUID
);

-- Test 4: No path (isolated node — full traversal with no result)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM find_relationship_paths(
  'f0000001-0000-0000-0000-000000000001'::UUID,  -- 社團/1
  'f0000009-0000-0000-0000-000000000001'::UUID,  -- 孤立節點
  3,
  'f0000000-0000-0000-0000-000000000000'::UUID
);
