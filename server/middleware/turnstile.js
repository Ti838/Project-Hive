/**
 * Cloudflare Turnstile CAPTCHA middleware
 * Verifies the cf-turnstile-response token from the request body
 * STRICT in production — blocks all requests without valid token
 */

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function turnstileMiddleware(req, res, next) {
  // Skip in development/test
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // If secret key not configured, warn and skip (misconfiguration)
  if (!TURNSTILE_SECRET) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY not set in environment! Skipping CAPTCHA.');
    return next();
  }

  const token = req.body['cf-turnstile-response'] || req.body.turnstileToken;

  // Strictly require token in production
  if (!token) {
    return res.status(400).json({
      error: 'Security verification required. Please complete the CAPTCHA.',
      code: 'CAPTCHA_MISSING',
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET);
    formData.append('response', token);
    formData.append('remoteip', req.ip);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const result = await response.json();

    if (!result.success) {
      console.warn('[Turnstile] Token rejected:', result['error-codes']);
      return res.status(400).json({
        error: 'Security check failed. Please try again.',
        code: 'CAPTCHA_FAILED',
      });
    }

    // Token valid — attach result to request for logging
    req.turnstileResult = result;
    next();

  } catch (err) {
    // If Cloudflare is unreachable, fail OPEN (don't block users due to Cloudflare outage)
    console.error('[Turnstile] Cloudflare unreachable:', err.message);
    next();
  }
}
