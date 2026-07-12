import { verifyAccessToken } from '../utils/jwt.utils.js';

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

export function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth.token;
    if (!token && socket.handshake.headers.cookie) {
      const parsed = parseCookie(socket.handshake.headers.cookie);
      token = parsed.accessToken;
    }
    
    if (!token) {
      return next(new Error('Missing authentication token'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    console.error('[v0] Socket auth middleware error:', error.message);
    next(new Error('Authentication error'));
  }
}
