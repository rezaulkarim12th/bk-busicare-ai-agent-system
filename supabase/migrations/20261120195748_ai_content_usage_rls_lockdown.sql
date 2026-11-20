-- Defense-in-depth for server-only AI usage accounting.
-- The table remains inaccessible to anon/authenticated via schema/table grants.
-- service_role is the only application role with table privileges.
REVOKE ALL ON TABLE private.ai_content_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE private.ai_content_usage TO service_role;

ALTER TABLE private.ai_content_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_ai_content_usage" ON private.ai_content_usage;
CREATE POLICY "service_role_manage_ai_content_usage"
  ON private.ai_content_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
