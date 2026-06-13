/**
 * Cloudflare Turnstile CAPTCHA middleware
 * Verifies the cf-turnstile-response token from the request body
 */

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function turnstileMiddleware(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const token = req.body['cf-turnstile-response'] || req.body.turnstileToken;

  if (!token) {
    return res.status(400).json({
      error: 'Security check required. Please complete the CAPTCHA.',
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
        error: 'Security check failed. Please try again.',
      });
    }

    next();
  } catch (err) {
    console.error('[ProjectHive] Turnstile error:', err.message);
    // Fail open if Cloudflare is unreachable
    next();
  }
}
