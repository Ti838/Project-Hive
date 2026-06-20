// ── Admin Authentication Controller ─────────────────────────────────────────
// Industrial-level: Admin credentials live ONLY in .env, not in the DB.
// Regular users can NEVER log in through this endpoint.
// Admin does NOT need a user account — fully independent auth system.
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Brute-force rate limiter for admin login ─────────────────────────────────
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkAdminLoginRate(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || (now - record.firstAttempt) > LOCKOUT_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

// Cleanup stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginAttempts) {
    if (now - v.firstAttempt > LOCKOUT_MS) loginAttempts.delete(k);
  }
}, 30 * 60 * 1000);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }
  return secret;
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Brute-force protection
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkAdminLoginRate(ip)) {
      console.warn('[Admin] ⚠️ Rate limited admin login from IP:', ip);
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }

    const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL    || '').toLowerCase().trim();
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('[Admin] ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      return res.status(503).json({ error: 'Admin credentials not configured on server.' });
    }

    // Timing-safe credential check to prevent timing attacks
    const emailInput = email.toLowerCase().trim();
    const emailMatch = emailInput.length === ADMIN_EMAIL.length &&
      crypto.timingSafeEqual(Buffer.from(emailInput), Buffer.from(ADMIN_EMAIL));
    const passwordMatch = password.length === ADMIN_PASSWORD.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));

    if (!emailMatch || !passwordMatch) {
      console.warn('[Admin] ❌ Failed admin login attempt for:', email);
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Reset rate limit on success
    loginAttempts.delete(ip);

    // Generate a short-lived admin JWT (4 hours — reduced from 8h for security)
    const secret = getJwtSecret();
    const token  = jwt.sign(
      { id: 'admin', email: ADMIN_EMAIL, role: 'admin', type: 'admin_access' },
      secret,
      { expiresIn: '4h' }
    );

    console.log('[Admin] 👑 Admin logged in:', ADMIN_EMAIL);

    return res.json({
      ok: true,
      message: 'Admin login successful.',
      token,
      admin: { email: ADMIN_EMAIL, role: 'admin' },
    });
  } catch (err) {
    console.error('[Admin] Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Middleware: verify admin token for protected routes
export function requireAdminToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Admin token required.' });
  try {
    const secret  = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
}
