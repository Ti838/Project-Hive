-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║          ProjectHive — Admin Hardening & Hardware Device Tracking          ║
-- ║  Run this in: Supabase Dashboard → SQL Editor → New Query → Run         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 1. Exact Device, Hardware & IP Tracking on Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
ADD COLUMN IF NOT EXISTS last_login_country TEXT,
ADD COLUMN IF NOT EXISTS last_login_city TEXT,
ADD COLUMN IF NOT EXISTS last_login_device_model TEXT,
ADD COLUMN IF NOT EXISTS last_login_os TEXT,
ADD COLUMN IF NOT EXISTS last_login_browser TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_login_ip ON users(last_login_ip);

-- 2. Persistent Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  device_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

-- 3. Support tickets table (if not yet created)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) DEFAULT 'general',
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- 4. Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to admin audit logs"
  ON admin_audit_logs FOR ALL
  USING (true);

CREATE POLICY "Allow all access to support tickets"
  ON support_tickets FOR ALL
  USING (true);
