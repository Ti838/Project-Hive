/**
 * Cloudflare Turnstile middleware — DISABLED
 * Frontend widget removed; middleware passes all requests through.
 * Re-enable by restoring widget in login.html + register.html
 */
export async function turnstileMiddleware(req, res, next) {
  return next();
}
