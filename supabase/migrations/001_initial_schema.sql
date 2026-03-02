-- ============================================================
-- Knoty — 001_initial_schema.sql
-- 參照 Spec §4.1 核心 Schema + §4.2 關鍵查詢
--
-- UP Migration
-- ============================================================

-- ============================================================
-- HELPER: 自動更新 updated_at 的 trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: persons
-- 人物節點（暱稱優先設計）
-- 注意：real_name_local 只存裝置端，不進 server DB（隱私設計原則）
-- ============================================================

CREATE TABLE persons (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,          -- 暱稱/代稱/關係稱謂（如「社團學姐」）
    avatar_emoji VARCHAR(10),                    -- emoji 頭像，降低隱私風險
    circles      TEXT[]      NOT NULL DEFAULT '{}', -- 所屬情境圈：["社團", "班上"]
    tags         TEXT[]      NOT NULL DEFAULT '{}', -- 自定義標籤：["話多", "值得信任"]
    notes        TEXT,                           -- 私人備忘
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: relationships
-- 關係邊（雙向儲存，CHECK person_a < person_b 防重複邊）
-- direction 欄位描述實際關係方向語意
-- ============================================================

CREATE TABLE relationships (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_a  UUID        NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_b  UUID        NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    closeness INT         NOT NULL DEFAULT 3
                          CHECK (closeness BETWEEN 1 AND 5),
                          -- 1=陌生/有嫌隙, 2=不太熟, 3=普通, 4=不錯, 5=非常好
    label     VARCHAR(50),           -- "同盟", "競爭", "表面客氣", "有心結"
    direction VARCHAR(20) NOT NULL DEFAULT 'mutual'
                          CHECK (direction IN ('mutual', 'a_to_b', 'b_to_a')),
                          -- mutual=雙向, a_to_b=A單方好, b_to_a=B單方好
    context   VARCHAR(50),           -- 關係所屬圈子："職場", "朋友"
    notes     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 防重複邊：強制 person_a < person_b（UUID 字典序）
    -- INSERT 前 app 層需排序：若 from_id > to_id 則交換並對應調整 direction
    CONSTRAINT chk_person_order CHECK (person_a < person_b),

    -- context NULL 時視為空字串參與唯一性判斷（避免 NULL != NULL 漏洞）
    CONSTRAINT uq_relationship UNIQUE NULLS NOT DISTINCT (user_id, person_a, person_b, context)
);

CREATE TRIGGER trg_relationships_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: events
-- 事件時間軸
-- ============================================================

CREATE TABLE events (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    involved_persons UUID[]      NOT NULL,       -- 涉及的 person IDs（至少 1 人）
    event_type       VARCHAR(30) NOT NULL
                                 CHECK (event_type IN (
                                     'conflict', 'favor', 'betrayal',
                                     'reconcile', 'milestone', 'note'
                                 )),
    description      TEXT        NOT NULL,       -- "A 在會議上幫我擋了一刀"
    impact           INT         NOT NULL DEFAULT 0
                                 CHECK (impact BETWEEN -3 AND 3),
                                 -- -3=嚴重負面, 0=中性, +3=非常正面
    occurred_at      DATE        NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_involved_persons_not_empty
        CHECK (array_length(involved_persons, 1) >= 1)
);

-- ============================================================
-- TABLE: circle_templates
-- 情境模板（系統預設 + 用戶自訂）
-- 系統模板：is_system=true, user_id=NULL
-- 用戶模板：is_system=false, user_id=auth.uid()
-- ============================================================

CREATE TABLE circle_templates (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
    name           VARCHAR(50) NOT NULL,         -- "職場", "朋友圈", "家族"
    is_system      BOOLEAN     NOT NULL DEFAULT false,
    preset_roles   TEXT[]      NOT NULL DEFAULT '{}', -- ["直屬主管", "同部門同事"]
    preset_labels  TEXT[]      NOT NULL DEFAULT '{}', -- ["同盟", "競爭", "表面客氣"]
    description    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 系統模板 user_id 必須 NULL；用戶模板 user_id 不得 NULL
    CONSTRAINT chk_system_template CHECK (
        (is_system = true  AND user_id IS NULL) OR
        (is_system = false AND user_id IS NOT NULL)
    )
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Policy: auth.uid() = user_id（CLAUDE.md 規範）
-- ============================================================

ALTER TABLE persons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_templates ENABLE ROW LEVEL SECURITY;

-- persons（用戶只能存取自己的人物）
CREATE POLICY persons_select ON persons
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY persons_insert ON persons
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY persons_update ON persons
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY persons_delete ON persons
    FOR DELETE USING (auth.uid() = user_id);

-- relationships（用戶只能存取自己的關係）
CREATE POLICY relationships_select ON relationships
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY relationships_insert ON relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY relationships_update ON relationships
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY relationships_delete ON relationships
    FOR DELETE USING (auth.uid() = user_id);

-- events（用戶只能存取自己的事件）
CREATE POLICY events_select ON events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY events_insert ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY events_update ON events
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY events_delete ON events
    FOR DELETE USING (auth.uid() = user_id);

-- circle_templates（可讀全部系統模板 + 自己的自訂模板；只能寫自己的）
CREATE POLICY circle_templates_select ON circle_templates
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY circle_templates_insert ON circle_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY circle_templates_update ON circle_templates
    FOR UPDATE USING (auth.uid() = user_id AND is_system = false)
    WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY circle_templates_delete ON circle_templates
    FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- ============================================================
-- INDEXES
-- ============================================================

-- persons
CREATE INDEX idx_persons_user_id ON persons (user_id);
CREATE INDEX idx_persons_circles  ON persons USING GIN (circles);
CREATE INDEX idx_persons_tags     ON persons USING GIN (tags);

-- relationships（路徑搜尋需要從兩端快速找鄰居）
CREATE INDEX idx_relationships_user_person_a
    ON relationships (user_id, person_a);
CREATE INDEX idx_relationships_user_person_b
    ON relationships (user_id, person_b);
CREATE INDEX idx_relationships_closeness
    ON relationships (user_id, closeness);

-- events
CREATE INDEX idx_events_user_occurred
    ON events (user_id, occurred_at DESC);
CREATE INDEX idx_events_involved_persons
    ON events USING GIN (involved_persons);

-- circle_templates
CREATE INDEX idx_circle_templates_user_id
    ON circle_templates (user_id);
CREATE INDEX idx_circle_templates_system
    ON circle_templates (is_system) WHERE is_system = true;

-- ============================================================
-- FUNCTION: find_relationship_paths
--
-- 查詢兩人之間的關係路徑，用於社交風險分析（Spec §4.2）
-- 因 CHECK(person_a < person_b)，遞迴時需查兩方向
-- 回傳: path(路徑節點陣列), min_closeness(路徑最弱一環), depth(跳數)
-- 預設最大深度 3（Sprint 0 驗證目標：200 節點下 < 100ms）
--
-- 使用方式：SELECT * FROM find_relationship_paths(
--               '起點 person_id', '終點 person_id', 3
--           );
-- auth.uid() 自動限制只查詢呼叫者自己的資料（SECURITY INVOKER + RLS）
-- ============================================================

CREATE OR REPLACE FUNCTION find_relationship_paths(
    p_from_id   UUID,
    p_to_id     UUID,
    p_max_depth INT DEFAULT 3
)
RETURNS TABLE (
    path          UUID[],
    min_closeness INT,
    depth         INT
)
LANGUAGE sql
STABLE
-- SECURITY INVOKER（預設）：以呼叫者身份執行，RLS 自動生效
-- 搭配下方 WHERE user_id = auth.uid() 做雙重保護
AS $$
    WITH RECURSIVE path_search AS (

        -- ── 基底（非遞迴項）────────────────────────────────────────
        -- PostgreSQL recursive CTE 規定：非遞迴項與遞迴項之間
        -- 只能有一個 UNION ALL。兩方向合併成一個 SELECT，
        -- 用 CASE WHEN 判斷鄰居是 person_b 還是 person_a。
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
        WHERE r.user_id = auth.uid()
          AND (r.person_a = p_from_id OR r.person_b = p_from_id)

        UNION ALL

        -- ── 遞迴項 ─────────────────────────────────────────────────
        -- 同樣用 CASE WHEN 一次處理正向邊與反向邊，
        -- 確保整個 CTE 只有一個 UNION ALL。
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
        WHERE r.user_id = auth.uid()
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
-- DOWN Migration（Rollback）
-- 執行順序：反向刪除，避免 FK 衝突
-- ============================================================
--
-- DROP FUNCTION  IF EXISTS find_relationship_paths(UUID, UUID, INT);
-- DROP TABLE     IF EXISTS circle_templates CASCADE;
-- DROP TABLE     IF EXISTS events           CASCADE;
-- DROP TABLE     IF EXISTS relationships    CASCADE;
-- DROP TABLE     IF EXISTS persons          CASCADE;
-- DROP FUNCTION  IF EXISTS trigger_set_updated_at CASCADE;
