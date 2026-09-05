import { verifyAccessToken } from '../utils/jwt.utils.js';
import { supabaseAdmin } from '../config/supabase.js';

function parseCookie(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.match(/(.*?)=(.*)$/);
    if (parts) {
      cookies[parts[1].trim()] = (parts[2] || '').trim();
    }
  });
  return cookies;
}

export async function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth?.token;

    // Check authorization header fallback
    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }
    
    // Check cookie fallback if auth.token is not present
    if (!token && socket.handshake.headers?.cookie) {
      const parsed = parseCookie(socket.handshake.headers.cookie);
      token = parsed.accessToken || parsed.access_token || null;
    }

    // Strip Bearer prefix if provided
    if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    if (!token) {
      return next(new Error('Missing authentication token'));
    }

    try {
      const decoded = verifyAccessToken(token);
      let userId = decoded.id;

      // Dynamically resolve 'admin' placeholder ID to real database UUID
      if (userId === 'admin' && decoded.email) {
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', decoded.email.toLowerCase())
            .single();
          if (user) {
            userId = user.id;
          }
        } catch (_) {}
      }

      socket.userId = userId;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role || 'student';
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    console.error('[Socket Auth] Authentication error:', error.message);
    next(new Error('Authentication error'));
  }
}

