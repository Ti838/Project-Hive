/**
 * ProjectHive Enterprise Rate Limiter
 * Multi-Tier Protection:
 *   - Global API Protection (DDoS prevention)
 *   - Auth Protection (Brute-force protection on /login, /register, /forgot-password)
 *   - AI Endpoint Throttling (Protects external token quotas and concurrency)
 *   - Upload Protection (Storage quota defense)
 *
 * Implements standard IETF RateLimit-* headers and meaningful retry guidance.
 */
import rateLimit from 'express-rate-limit';

function standardHandler(message, windowSec = 60) {
  return (req, res, next, options) => {
    res.setHeader('Retry-After', windowSec);
    return res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: message || 'Too many requests. Please slow down and try again shortly.',
      retryAfterSeconds: windowSec,
      timestamp: new Date().toISOString(),
    });
  };
}

// ─── 1. GLOBAL API LIMITER ────────────────────────────────────────────────────
// 300 requests per 15 minutes per IP for general browsing
export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: standardHandler('General API rate limit exceeded. Please try again shortly.', 60),
});

// ─── 2. AUTH LIMITER (BRUTE FORCE DEFENSE) ───────────────────────────────────
// 20 attempts per 15 minutes. Skips successful requests.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { trustProxy: false },
  handler: standardHandler('Too many failed authentication attempts. Please try again in 15 minutes.', 900),
});

// ─── 3. AI ENDPOINT LIMITER ──────────────────────────────────────────────────
// 30 requests per minute per IP to protect Groq/Gemini external provider quotas
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: standardHandler('HiveMind AI generation rate limit reached. Please wait 30 seconds before submitting new prompts.', 30),
});

// ─── 4. FILE UPLOAD LIMITER ──────────────────────────────────────────────────
// 15 file uploads per 15 minutes to prevent bucket resource exhaustion
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: standardHandler('Upload rate limit reached. Please wait a few minutes before uploading more media.', 300),
});

