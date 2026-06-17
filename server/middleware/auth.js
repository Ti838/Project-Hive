import { verifyAccessToken } from '../utils/jwt.utils.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.substring(7);
    
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
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('[v0] Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
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
    console.error('[v0] Optional auth middleware error:', error.message);
    next();
  }
}

