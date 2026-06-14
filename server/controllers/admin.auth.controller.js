// ── Admin Authentication Controller ─────────────────────────────────────────
// Industrial-level: Admin credentials live ONLY in .env, not in the DB.
// Regular users can NEVER log in through this endpoint.
import jwt from 'jsonwebtoken';

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL    || '').toLowerCase().trim();
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('[Admin] ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      return res.status(503).json({ error: 'Admin credentials not configured on server.' });
    }

    // Strict credential check — both must match exactly
    const emailMatch    = email.toLowerCase().trim() === ADMIN_EMAIL;
    const passwordMatch = password === ADMIN_PASSWORD;

    if (!emailMatch || !passwordMatch) {
      // Generic error — don't hint which field is wrong
      console.warn('[Admin] ❌ Failed admin login attempt for:', email);
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Generate a short-lived admin JWT (8 hours)
    const secret = process.env.JWT_SECRET || 'projecthive-dev-secret';
    const token  = jwt.sign(
      { id: 'admin', email: ADMIN_EMAIL, role: 'admin', type: 'admin_access' },
      secret,
      { expiresIn: '8h' }
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
    const secret  = process.env.JWT_SECRET || 'projecthive-dev-secret';
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
