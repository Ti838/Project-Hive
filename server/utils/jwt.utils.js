import jwt from 'jsonwebtoken';

// Determine signing strategy: RS256 (key pair) or HS256 (secret)
function getSignConfig() {
  if (process.env.JWT_PRIVATE_KEY) {
    return {
      secret: process.env.JWT_PRIVATE_KEY,
      algorithm: 'RS256',
    };
  }
  // Fallback to HS256 with a simple secret (development)
  const secret = process.env.JWT_SECRET || 'projecthive-dev-secret-change-in-production';
  return { secret, algorithm: 'HS256' };
}

function getVerifyConfig() {
  if (process.env.JWT_PUBLIC_KEY) {
    return {
      secret: process.env.JWT_PUBLIC_KEY,
      algorithms: ['RS256'],
    };
  }
  const secret = process.env.JWT_SECRET || 'projecthive-dev-secret-change-in-production';
  return { secret, algorithms: ['HS256'] };
}

export function generateAccessToken(userId, email) {
  const { secret, algorithm } = getSignConfig();
  const payload = {
    id: userId,
    email: email,
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

export function generateTokenPair(userId, email) {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
}

export function verifyAccessToken(token) {
  const { secret, algorithms } = getVerifyConfig();
  try {
    return jwt.verify(token, secret, { algorithms });
  } catch (error) {
    throw error;
  }
}

export function verifyRefreshToken(token) {
  const { secret, algorithms } = getVerifyConfig();
  try {
    return jwt.verify(token, secret, { algorithms });
  } catch (error) {
    throw error;
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}
