-- ============================================================================
-- ProjectHive Admin Command Center & Moderation Engine Patch (v2.0)
-- ============================================================================

-- 1. CONTENT REPORTS TABLE (User-Generated & Automated Moderation Queue)
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'team', 'project')),
  target_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DISCIPLINARY STRIKE LEDGER TABLE
CREATE TABLE IF NOT EXISTS user_strikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  severity VARCHAR(30) DEFAULT 'warning' CHECK (severity IN ('warning', 'temporary_suspension', 'permanent_ban')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HIGH-PERFORMANCE INDEX OPTIMIZATIONS
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user ON user_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_banned ON users(role, is_banned);

-- 4. ROW LEVEL SECURITY & PERMISSIONS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "service_role_all_reports" ON content_reports;
CREATE POLICY "service_role_all_reports" ON content_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_strikes" ON user_strikes;
CREATE POLICY "service_role_all_strikes" ON user_strikes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can insert reports
DROP POLICY IF EXISTS "auth_users_can_create_reports" ON content_reports;
CREATE POLICY "auth_users_can_create_reports" ON content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
