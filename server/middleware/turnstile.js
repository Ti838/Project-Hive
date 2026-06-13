/**
 * Google reCAPTCHA v2 middleware
 * Verifies the g-recaptcha-response token from the request body
 */

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '6Lftkh0tAAAAAP8sdSsMyKrVNbeOKcEw_zMOoABs';
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function turnstileMiddleware(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const token = req.body['g-recaptcha-response'] || req.body.recaptchaToken;

  if (!token) {
    return res.status(400).json({
      error: 'Please complete the security check.',
      code: 'CAPTCHA_MISSING',
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET);
    params.append('response', token);
    params.append('remoteip', req.ip);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: params,
      signal: AbortSignal.timeout(5000),
    });

    const result = await response.json();

    if (!result.success) {
      console.warn('[reCAPTCHA] Verification failed:', result['error-codes']);
      return res.status(400).json({
        error: 'Security check failed. Please try again.',
        code: 'CAPTCHA_FAILED',
      });
    }

    next();
  } catch (err) {
    // Fail open if Google is unreachable
    console.error('[reCAPTCHA] Google unreachable:', err.message);
    next();
  }
}
