/**
 * CAPTCHA middleware — disabled (pass-through)
 * reCAPTCHA has been removed from the frontend.
 * This file is kept for compatibility but does nothing.
 */
export async function turnstileMiddleware(req, res, next) {
  return next();
}
