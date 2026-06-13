/**
 * Cloudflare Turnstile CAPTCHA middleware
 * Verifies the cf-turnstile-response token from the request body
 *
 * SOFT-MODE: If verification fails (e.g. domain not whitelisted, token missing),
 * we log a warning but still allow the request through.
 * To enforce strict mode, set TURNSTILE_STRICT=true in env.
 */

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const STRICT = process.env.TURNSTILE_STRICT === 'true';

export async function turnstileMiddleware(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // If no secret key configured, skip silently
  if (!TURNSTILE_SECRET) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping CAPTCHA check');
    return next();
  }

  const token = req.body['cf-turnstile-response'] || req.body.turnstileToken;

  if (!token) {
    if (STRICT) {
      return res.status(400).json({
        error: 'Security check required. Please complete the CAPTCHA.',
      });
    }
    // Soft mode: no token → warn and allow
    console.warn('[Turnstile] No token provided — allowing request (soft mode)');
    return next();
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET);
    formData.append('response', token);
    formData.append('remoteip', req.ip);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      console.warn('[Turnstile] Verification failed:', result['error-codes']);
      if (STRICT) {
        return res.status(400).json({
          error: 'Security check failed. Please try again.',
        });
      }
      // Soft mode: failed verification → warn and allow
      return next();
    }

    next();
  } catch (err) {
    console.error('[Turnstile] Error contacting Cloudflare:', err.message);
    // Always fail open if Cloudflare is unreachable
    next();
  }
}
