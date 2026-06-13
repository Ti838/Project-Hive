/**
 * Cloudflare Turnstile CAPTCHA middleware
 * Verifies the cf-turnstile-response token from the request body
 */

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Skip CAPTCHA in test mode (for development)
const isTestKey = TURNSTILE_SECRET && TURNSTILE_SECRET.startsWith('1x0000000000000000000000000000000');

export async function turnstileMiddleware(req, res, next) {
  // Skip in development with test keys
  if (process.env.NODE_ENV === 'development' && isTestKey) {
    console.log('[ProjectHive] 🔓 Turnstile skipped (test mode)');
    return next();
  }

  const token = req.body['cf-turnstile-response'] || req.body.turnstileToken;

  if (!token) {
    return res.status(400).json({
      error: 'CAPTCHA verification required. Please complete the security check.',
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
    });

    const result = await response.json();

    if (!result.success) {
      console.warn('[ProjectHive] Turnstile failed:', result['error-codes']);
      return res.status(400).json({
        error: 'CAPTCHA verification failed. Please try again.',
        codes: result['error-codes'],
      });
    }

    console.log('[ProjectHive] ✅ Turnstile passed');
    next();
  } catch (err) {
    console.error('[ProjectHive] Turnstile error:', err.message);
    // Fail open in case Cloudflare is down
    next();
  }
}
