import { supabaseAdmin } from '../config/supabase.js';

/**
 * Log a security, moderation, or administrative audit event to admin_audit_logs.
 * Fire-and-forget: Catches and logs errors without failing caller transactions.
 */
export async function logSecurityEvent({
  adminId = null,
  adminEmail = null,
  email = null,
  action,
  targetType = 'SYSTEM',
  target_type = null,
  targetId = null,
  target_id = null,
  details = {},
  ipAddress = null,
  ip_address = null,
  req = null,
  deviceModel = null,
} = {}) {
  try {
    if (!action) return;

    // Resolve IP address
    const resolvedIp = ipAddress || ip_address || (req ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress) : null);
    
    // Resolve admin email
    const resolvedEmail = adminEmail || email || (req?.user?.email) || 'system@projecthive.com';

    // Resolve admin ID
    const resolvedAdminId = adminId && adminId !== 'admin' ? adminId : (req?.user?.id && req.user.id !== 'admin' ? req.user.id : null);

    // Resolve target info
    const resolvedTargetType = targetType || target_type || 'SYSTEM';
    const resolvedTargetId = targetId || target_id ? String(targetId || target_id) : null;

    // Resolve device model
    const resolvedDeviceModel = deviceModel || req?.headers['x-device-model'] || req?.body?.deviceMeta?.deviceModel || null;

    let mergedDetails = {};
    if (typeof details === 'object' && details !== null) {
      mergedDetails = { ...details };
    } else if (typeof details === 'string') {
      try {
        mergedDetails = JSON.parse(details);
      } catch {
        mergedDetails = { note: details };
      }
    }

    if (resolvedDeviceModel && !mergedDetails.deviceModel) {
      mergedDetails.deviceModel = resolvedDeviceModel;
    }

    await supabaseAdmin.from('admin_audit_logs').insert([{
      admin_id: resolvedAdminId,
      admin_email: resolvedEmail,
      action,
      target_type: resolvedTargetType,
      target_id: resolvedTargetId,
      details: mergedDetails,
      ip_address: resolvedIp,
      device_model: resolvedDeviceModel,
      created_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.warn('[AuditService] Failed to record audit log:', err.message);
  }
}

/**
 * Alias for logSecurityEvent to ensure full backward compatibility across all controllers
 */
export const logAdminAction = logSecurityEvent;

export default {
  logSecurityEvent,
  logAdminAction,
};
