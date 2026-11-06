import { supabaseAdmin } from '../config/supabase.js';

/**
 * Log a security or administrative audit event to admin_audit_logs.
 * Fire-and-forget: Catches and logs errors without failing caller transactions.
 */
export async function logSecurityEvent({
  adminId = null,
  adminEmail = 'system@projecthive.com',
  action,
  targetType = 'SYSTEM',
  targetId = null,
  details = {},
  ipAddress = null,
} = {}) {
  try {
    if (!action) return;
    await supabaseAdmin.from('admin_audit_logs').insert([{
      admin_id: adminId && adminId !== 'admin' ? adminId : null,
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId ? String(targetId) : null,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.warn('[AuditService] Failed to record audit log:', err.message);
  }
}

export default {
  logSecurityEvent,
};
