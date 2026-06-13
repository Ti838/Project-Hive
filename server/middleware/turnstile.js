/**
 * Cloudflare Turnstile middleware — DISABLED
 * Turnstile removed for better UX. Always passes.
 */
export async function turnstileMiddleware(req, res, next) {
  // Turnstile disabled — pass through always
  return next();
}
