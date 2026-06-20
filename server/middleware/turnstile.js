/**
 * Cloudflare Turnstile CAPTCHA middleware
 * Validates the Turnstile token sent from the frontend.
 * Falls through as pass-through ONLY if TURNSTILE_SECRET_KEY is not set (dev mode).
 */
export async function turnstileMiddleware(req, res, next) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Skip in development if no key is configured
  if (!secretKey || secretKey.startsWith('1x00000000')) {
    return next();
  }

  const turnstileToken = req.body?.turnstileToken || req.body?.captchaToken || req.headers['x-turnstile-token'];

  if (!turnstileToken) {
    return res.status(400).json({ error: 'CAPTCHA verification required.' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: turnstileToken,
        remoteip: req.ip || req.headers['x-forwarded-for'],
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('[Turnstile] CAPTCHA failed:', data['error-codes']);
      return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }

    next();
  } catch (err) {
    console.error('[Turnstile] Verification error:', err.message);
    // Fail open in case of Cloudflare outage (configurable)
    next();
  }
}
