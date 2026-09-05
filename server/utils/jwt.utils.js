import jwt from 'jsonwebtoken';
import { keySigner } from '../services/crypto/keySigner.service.js';

/**
 * Generate cryptographically signed Access Token via KeySigner abstraction
 */
export function generateAccessToken(userId, email, role = 'student') {
  const payload = {
    id: userId,
    email: email,
    role: role,
    type: 'access',
  };

  return keySigner.signAccessToken(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

/**
 * Generate cryptographically signed Refresh Token via KeySigner abstraction
 */
export function generateRefreshToken(userId, email) {
  const payload = {
    id: userId,
    email: email,
    type: 'refresh',
  };

  return keySigner.signRefreshToken(payload, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
}

/**
 * Generate coordinated Access and Refresh Token pair
 */
export function generateTokenPair(userId, email, role = 'student') {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email),
  };
}

/**
 * Verify Access Token via KeySigner (RS256/HS256 dual verification)
 */
export function verifyAccessToken(token) {
  const decoded = keySigner.verifyToken(token);
  // Prevent refresh tokens from being used as access tokens
  if (decoded.type && decoded.type !== 'access' && decoded.type !== 'admin_access') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    err.code = 'INVALID_TOKEN';
    throw err;
  }
  return decoded;
}

/**
 * Verify Refresh Token via KeySigner
 */
export function verifyRefreshToken(token) {
  const decoded = keySigner.verifyToken(token);
  // Ensure only refresh tokens are accepted for refresh operations
  if (decoded.type && decoded.type !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    err.code = 'INVALID_TOKEN';
    throw err;
  }
  return decoded;
}

/**
 * Decode JWT token payload without signature verification (diagnostic only)
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

// ─── STANDARDIZED CROSS-DOMAIN COOKIE HELPERS ─────────────────────────────────
// CHIPS (Cookies Having Independent Partitioned State) compliant
export function getAuthCookieOptions(type = 'access') {
  const isProd = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    ...(isProd ? { partitioned: true } : {}),
  };

  if (type === 'access') {
    return {
      ...baseOptions,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  if (type === 'refresh') {
    return {
      ...baseOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  return baseOptions;
}

export function setAuthCookies(res, accessToken, refreshToken) {
  if (accessToken) {
    res.cookie('accessToken', accessToken, getAuthCookieOptions('access'));
    res.cookie('access_token', accessToken, getAuthCookieOptions('access'));
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, getAuthCookieOptions('refresh'));
    res.cookie('refresh_token', refreshToken, getAuthCookieOptions('refresh'));
  }
}

export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    ...(isProd ? { partitioned: true } : {}),
    maxAge: 0,
  };
  res.clearCookie('accessToken', options);
  res.clearCookie('access_token', options);
  res.clearCookie('refreshToken', options);
  res.clearCookie('refresh_token', options);
}
