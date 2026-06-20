import jwt from 'jsonwebtoken';

// ── SECURITY: No fallback secrets — fail fast if not configured ──────────────
function getSignConfig() {
  if (process.env.JWT_PRIVATE_KEY) {
    return {
      secret: process.env.JWT_PRIVATE_KEY,
      algorithm: 'RS256',
    };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET is not set. Server cannot sign tokens without a secret.');
  }
  return { secret, algorithm: 'HS256' };
}

function getVerifyConfig() {
  if (process.env.JWT_PUBLIC_KEY) {
    return {
      secret: process.env.JWT_PUBLIC_KEY,
      algorithms: ['RS256'],
    };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET is not set. Server cannot verify tokens without a secret.');
  }
  return { secret, algorithms: ['HS256'] };
}

export function generateAccessToken(userId, email, role = 'student') {
  const { secret, algorithm } = getSignConfig();
  const payload = {
    id: userId,
    email: email,
    role: role,
    type: 'access',
  };

  return jwt.sign(payload, secret, {
    algorithm,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

export function generateRefreshToken(userId, email) {
  const { secret, algorithm } = getSignConfig();
  const payload = {
    id: userId,
    email: email,
    type: 'refresh',
  };

  return jwt.sign(payload, secret, {
    algorithm,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
}

export function generateTokenPair(userId, email, role = 'student') {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email),
  };
}

export function verifyAccessToken(token) {
  const { secret, algorithms } = getVerifyConfig();
  const decoded = jwt.verify(token, secret, { algorithms });
  // Prevent refresh tokens from being used as access tokens
  if (decoded.type && decoded.type !== 'access' && decoded.type !== 'admin_access') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
}

export function verifyRefreshToken(token) {
  const { secret, algorithms } = getVerifyConfig();
  const decoded = jwt.verify(token, secret, { algorithms });
  // Ensure only refresh tokens are accepted for refresh operations
  if (decoded.type && decoded.type !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
}

export function decodeToken(token) {
  return jwt.decode(token);
}
