-- supabase/migrations/003_ai_usage.sql
-- UP Migration

CREATE TABLE ai_usage (
  user_id  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month    CHAR(7) NOT NULL,  -- 'YYYY-MM'
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read and upsert their own usage rows
-- No DELETE policy: usage rows are append-only to prevent quota gaming
CREATE POLICY ai_usage_select ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_usage_insert ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ai_usage_update ON ai_usage
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DOWN Migration (uncomment to rollback)
-- DROP TABLE IF EXISTS ai_usage CASCADE;
