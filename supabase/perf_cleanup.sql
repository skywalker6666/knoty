-- ============================================================
-- Knoty — perf_cleanup.sql
-- PoC 3: Remove all benchmark data
--
-- Deleting persons cascades to relationships (ON DELETE CASCADE).
-- Run in: Supabase Dashboard → SQL Editor (after benchmark)
-- ============================================================

DELETE FROM persons
WHERE user_id = 'f0000000-0000-0000-0000-000000000000';

-- Verify cleanup
SELECT
  (SELECT count(*) FROM persons       WHERE user_id = 'f0000000-0000-0000-0000-000000000000') AS persons_remaining,
  (SELECT count(*) FROM relationships WHERE user_id = 'f0000000-0000-0000-0000-000000000000') AS relationships_remaining;
-- Expected: 0, 0
