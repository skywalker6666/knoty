-- ============================================================
-- Knoty — perf_seed.sql
-- PoC 3: Supabase CTE Latency Benchmark
--
-- Generates 200 persons + ~460 relationships for a single
-- PERF_USER_ID that does not exist in auth.users.
-- session_replication_role = replica skips FK checks safely.
--
-- Run in: Supabase Dashboard → SQL Editor
-- Clean up with: perf_cleanup.sql
-- ============================================================

-- Note: Dashboard SQL Editor runs as `postgres` (superuser).
-- SET LOCAL session_replication_role = replica  → skips FK trigger checks (bypasses persons.user_id → auth.users FK)
-- SET LOCAL row_security = off                  → disables RLS (required since auth.uid() = NULL in Dashboard context)
-- Both require superuser — available in Supabase Dashboard.

BEGIN;
SET LOCAL session_replication_role = replica;
SET LOCAL row_security = off;

DO $$
DECLARE
  perf_uid UUID   := 'f0000000-0000-0000-0000-000000000000';
  prefixes TEXT[] := ARRAY['f0000001', 'f0000002', 'f0000003', 'f0000004'];
  circles  TEXT[] := ARRAY['社團', '班上', '宿舍', '打工'];
  c INT;
  i INT;
  pa UUID;
  pb UUID;
BEGIN

  -- ── 1. Persons (200 nodes: 50 per circle) ──────────────────
  FOR c IN 1..4 LOOP
    FOR i IN 1..50 LOOP
      INSERT INTO persons (id, user_id, display_name, avatar_emoji, circles)
      VALUES (
        (prefixes[c] || '-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::UUID,
        perf_uid,
        circles[c] || ' ' || i::text,
        '👤',
        ARRAY[circles[c]]
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Isolated node (no relationships → no path from/to it)
  INSERT INTO persons (id, user_id, display_name, avatar_emoji, circles)
  VALUES (
    'f0000009-0000-0000-0000-000000000001',
    perf_uid, '孤立節點', '🔴', ARRAY[]::TEXT[]
  ) ON CONFLICT DO NOTHING;

  -- ── 2. Intra-circle relationships ──────────────────────────
  -- Chain: i ↔ i+1 (49 edges per circle = 196 total)
  -- Skip:  i ↔ i+3 (47 edges per circle = 188 total)
  -- All satisfy CHECK(person_a < person_b) because i < i+1 and i < i+3
  FOR c IN 1..4 LOOP
    FOR i IN 1..49 LOOP
      pa := (prefixes[c] || '-0000-0000-0000-' || lpad(to_hex(i),   12, '0'))::UUID;
      pb := (prefixes[c] || '-0000-0000-0000-' || lpad(to_hex(i+1), 12, '0'))::UUID;
      INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
      VALUES (perf_uid, pa, pb, 3 + (i % 3), 'mutual')
      ON CONFLICT DO NOTHING;
    END LOOP;

    FOR i IN 1..47 LOOP
      pa := (prefixes[c] || '-0000-0000-0000-' || lpad(to_hex(i),   12, '0'))::UUID;
      pb := (prefixes[c] || '-0000-0000-0000-' || lpad(to_hex(i+3), 12, '0'))::UUID;
      INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
      VALUES (perf_uid, pa, pb, 2 + (i % 2), 'mutual')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- ── 3. Cross-circle bulk bridges (25 per boundary = 75 total) ──
  -- f0000001 < f0000002 < f0000003 < f0000004 so person_a < person_b always ✓
  FOR i IN 1..25 LOOP
    -- 社團/20+i ↔ 班上/i
    pa := ('f0000001-0000-0000-0000-' || lpad(to_hex(20 + i), 12, '0'))::UUID;
    pb := ('f0000002-0000-0000-0000-' || lpad(to_hex(i),      12, '0'))::UUID;
    INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
    VALUES (perf_uid, pa, pb, 2, 'mutual') ON CONFLICT DO NOTHING;

    -- 班上/20+i ↔ 宿舍/i
    pa := ('f0000002-0000-0000-0000-' || lpad(to_hex(20 + i), 12, '0'))::UUID;
    pb := ('f0000003-0000-0000-0000-' || lpad(to_hex(i),      12, '0'))::UUID;
    INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
    VALUES (perf_uid, pa, pb, 2, 'mutual') ON CONFLICT DO NOTHING;

    -- 宿舍/20+i ↔ 打工/i
    pa := ('f0000003-0000-0000-0000-' || lpad(to_hex(20 + i), 12, '0'))::UUID;
    pb := ('f0000004-0000-0000-0000-' || lpad(to_hex(i),      12, '0'))::UUID;
    INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
    VALUES (perf_uid, pa, pb, 2, 'mutual') ON CONFLICT DO NOTHING;
  END LOOP;

  -- ── 4. Explicit test bridges ────────────────────────────────
  -- Enables Test 2 (2-hop): 社團/1 → 社團/2 → 班上/1
  INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
  VALUES (
    perf_uid,
    'f0000001-0000-0000-0000-000000000002'::UUID,  -- 社團/2
    'f0000002-0000-0000-0000-000000000001'::UUID,  -- 班上/1
    2, 'mutual'
  ) ON CONFLICT DO NOTHING;

  -- Enables Test 3 (3-hop): +1 hop → 宿舍/1
  INSERT INTO relationships (user_id, person_a, person_b, closeness, direction)
  VALUES (
    perf_uid,
    'f0000002-0000-0000-0000-000000000001'::UUID,  -- 班上/1
    'f0000003-0000-0000-0000-000000000001'::UUID,  -- 宿舍/1
    2, 'mutual'
  ) ON CONFLICT DO NOTHING;

END $$;

COMMIT;

-- ── Verification ────────────────────────────────────────────
-- Run after seed to confirm counts:
SELECT
  (SELECT count(*) FROM persons       WHERE user_id = 'f0000000-0000-0000-0000-000000000000') AS persons,
  (SELECT count(*) FROM relationships WHERE user_id = 'f0000000-0000-0000-0000-000000000000') AS relationships;
-- Expected: persons=201, relationships=461
