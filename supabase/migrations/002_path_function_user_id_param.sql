-- ============================================================
-- Knoty — 002_path_function_user_id_param.sql
--
-- UP Migration
-- Problem: find_relationship_paths() uses auth.uid() internally,
--          but admin client (service_role) has no user session →
--          auth.uid() returns NULL → WHERE user_id = NULL → 0 rows.
--
-- Fix: add optional p_user_id parameter.
--      Admin callers pass the UID explicitly (Sprint 0).
--      Authenticated callers omit it; COALESCE falls back to auth.uid().
-- ============================================================

CREATE OR REPLACE FUNCTION find_relationship_paths(
    p_from_id   UUID,
    p_to_id     UUID,
    p_max_depth INT  DEFAULT 3,
    p_user_id   UUID DEFAULT NULL   -- NULL → fall back to auth.uid()
)
RETURNS TABLE (
    path          UUID[],
    min_closeness INT,
    depth         INT
)
LANGUAGE sql
STABLE
AS $$
    WITH RECURSIVE path_search AS (

        -- ── 基底（非遞迴項）────────────────────────────────────────
        SELECT
            CASE
                WHEN r.person_a = p_from_id THEN r.person_b
                ELSE r.person_a
            END                                          AS current_node,
            ARRAY[p_from_id,
                CASE
                    WHEN r.person_a = p_from_id THEN r.person_b
                    ELSE r.person_a
                END
            ]                                            AS visited,
            r.closeness                                  AS min_closeness,
            1                                            AS depth
        FROM relationships r
        WHERE r.user_id = COALESCE(p_user_id, auth.uid())
          AND (r.person_a = p_from_id OR r.person_b = p_from_id)

        UNION ALL

        -- ── 遞迴項 ─────────────────────────────────────────────────
        SELECT
            CASE
                WHEN r.person_a = ps.current_node THEN r.person_b
                ELSE r.person_a
            END                                          AS current_node,
            ps.visited || CASE
                WHEN r.person_a = ps.current_node THEN r.person_b
                ELSE r.person_a
            END                                          AS visited,
            LEAST(ps.min_closeness, r.closeness)         AS min_closeness,
            ps.depth + 1                                 AS depth
        FROM relationships r
        JOIN path_search ps
          ON r.person_a = ps.current_node OR r.person_b = ps.current_node
        WHERE r.user_id = COALESCE(p_user_id, auth.uid())
          AND CASE
                WHEN r.person_a = ps.current_node THEN r.person_b
                ELSE r.person_a
              END != ALL(ps.visited)         -- 避免迴圈
          AND ps.depth < p_max_depth

    )
    SELECT
        ps.visited       AS path,
        ps.min_closeness AS min_closeness,
        ps.depth         AS depth
    FROM path_search ps
    WHERE ps.current_node = p_to_id
    ORDER BY ps.depth ASC, ps.min_closeness DESC;
$$;

-- ============================================================
-- DOWN Migration
-- ============================================================
-- Restore original (no p_user_id param, strict auth.uid() only):
--
-- CREATE OR REPLACE FUNCTION find_relationship_paths(
--     p_from_id   UUID,
--     p_to_id     UUID,
--     p_max_depth INT DEFAULT 3
-- ) RETURNS TABLE (path UUID[], min_closeness INT, depth INT)
-- LANGUAGE sql STABLE AS $$
--     ... (original body with auth.uid()) ...
-- $$;
