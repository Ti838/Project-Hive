import { supabaseAdmin } from '../config/supabase.js';
import { verifyAccessToken } from '../utils/jwt.utils.js';

/**
 * Enterprise Live Database-Backed Admin Authentication Middleware
 * 
 * Verifies both valid JWT cryptographic signature AND performs real-time database
 * authorization lookup to ensure the account has active role === 'admin' and is not banned.
 * Eliminates stale JWT claims and privilege desynchronization vulnerabilities.
 */
export async function adminAuthMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies) {
      token = req.cookies.accessToken || req.cookies.access_token || null;
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing administrative authorization token', code: 'TOKEN_MISSING' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.code === 'TOKEN_EXPIRED' || jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Admin session expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid admin token', code: 'INVALID_TOKEN' });
    }

    const userId = decoded.id;
    const userEmail = decoded.email;

    // Database lookup for live role and account status verification
    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_banned, is_verified, avatar, avatar_color');

    if (userId && userId !== 'admin') {
      query = query.eq('id', userId);
    } else if (userEmail) {
      query = query.eq('email', userEmail.toLowerCase());
    } else {
      return res.status(403).json({ error: 'Forbidden: Unresolvable admin identity', code: 'ADMIN_IDENTITY_UNKNOWN' });
    }

    const { data: adminUser, error } = await query.maybeSingle();

    if (error || !adminUser) {
      return res.status(403).json({ error: 'Forbidden: Admin user record not found in system', code: 'ADMIN_NOT_FOUND' });
    }

    if (adminUser.is_banned) {
      return res.status(403).json({ error: 'Access Denied: Administrative account is restricted or suspended', code: 'ACCOUNT_SUSPENDED' });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient security clearance (role !== admin)', code: 'ADMIN_CLEARANCE_REQUIRED' });
    }

    // Attach verified admin context
    req.user = {
      ...decoded,
      id: adminUser.id,
      role: adminUser.role,
      email: adminUser.email,
      firstName: adminUser.first_name,
      lastName: adminUser.last_name,
    };
    req.admin = adminUser;

    next();
  } catch (err) {
    console.error('[Admin Auth Guard] Internal verification failure:', err.message);
    return res.status(500).json({ error: 'Internal security guard failure', code: 'AUTH_GUARD_ERROR' });
  }
}

export default adminAuthMiddleware;
