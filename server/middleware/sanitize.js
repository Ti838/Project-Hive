/**
 * Input Sanitization Middleware
 * Strips dangerous HTML/script tags from all string inputs in request body
 * to prevent Stored XSS attacks.
 */

// Regex to strip potentially dangerous HTML tags
const DANGEROUS_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAGS = /<\/?(?:script|iframe|object|embed|form|input|button|svg|math|style|link|meta|base)[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI = /javascript\s*:/gi;
const DATA_URI = /data\s*:\s*text\/html/gi;

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(DANGEROUS_TAGS, '')
    .replace(HTML_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URI, '')
    .replace(DATA_URI, '');
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Don't sanitize password fields (they might contain special chars)
      if (key === 'password' || key === 'currentPassword' || key === 'newPassword' || key === 'password_hash') {
        cleaned[key] = value;
      } else if (key === 'imageBase64' || key === 'mimeType' || key === 'avatar' || key === 'bannerImage') {
        // Don't sanitize base64 image data (profile photos, banners)
        cleaned[key] = value;
      } else if (key === 'content' && typeof value === 'string' && value.trimStart().startsWith('{')) {
        // Don't sanitize message content that is JSON media payload (base64 images/voice)
        cleaned[key] = value;
      } else {
        cleaned[key] = sanitizeObject(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export function sanitizeInputMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}
