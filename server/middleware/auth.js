import { verifyAccessToken } from '../utils/jwt.utils.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function authMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies) {
      token = req.cookies.accessToken || req.cookies.access_token || null;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token', code: 'TOKEN_MISSING' });
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;

      // Dynamically resolve 'admin' placeholder ID to real database UUID
      if (req.user.id === 'admin' && req.user.email) {
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', req.user.email.toLowerCase())
            .single();
          if (user) {
            req.user.id = user.id;
          }
        } catch (_) {}
      }

      next();
    } catch (error) {
      if (error.code === 'TOKEN_EXPIRED' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', error.message);
    res.status(500).json({ error: 'Authentication error', code: 'AUTH_ERROR' });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies) {
      token = req.cookies.accessToken || req.cookies.access_token || null;
    }
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;

      // Dynamically resolve 'admin' placeholder ID to real database UUID
      if (req.user.id === 'admin' && req.user.email) {
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', req.user.email.toLowerCase())
            .single();
          if (user) {
            req.user.id = user.id;
          }
        } catch (_) {}
      }
    } catch (error) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Optional auth error:', error.message);
    next();
  }
}
