import { verifyAccessToken } from '../utils/jwt.utils.js';

export function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
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
