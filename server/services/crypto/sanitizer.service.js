// ─── Confidential AI Prompt Sanitizer & Zero-Leak Pipeline ─────────────────
// Confidential Computing Phase 2: In-memory detection, masking, and reversible
// redaction of sensitive credentials, database URIs, and student PII before
// dispatching payloads to external LLMs (Groq, Gemini, OpenRouter).

import crypto from 'crypto';

// Bounded input length to protect against ReDoS attacks (500 KB limit)
const MAX_SCAN_LENGTH = 500 * 1024;

// Educational & Dummy Whitelist to prevent false positives in tutorials
const BENIGN_WHITELIST = [
  /example\.com/i,
  /test\.com/i,
  /sample\.com/i,
  /your[_-]?(?:api)?[_-]?key/i,
  /insert[_-]?(?:api)?[_-]?key/i,
  /<[^>]+>/, // Placeholders like <API_KEY>, <PASSWORD>
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /user:password@localhost/i,
  /user:pass@localhost/i,
  /mysecretpassword/i,
  /dummy/i,
  /fake/i,
  /placeholder/i,
];

/**
 * Check if a matched string matches benign educational examples
 */
function isWhitelisted(val) {
  if (!val) return true;
  return BENIGN_WHITELIST.some((pattern) => pattern.test(val));
}

// ── Strict Non-Backtracking Patterns for High-Risk Secrets ─────────────────────
const SANITIZATION_RULES = [
  {
    type: 'PRIVATE_KEY',
    // Matches PEM RSA/EC/OPENSSH/PGP private keys
    regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)? ?PRIVATE KEY-----[\s\S]*?-----END (?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)? ?PRIVATE KEY-----/g,
  },
  {
    type: 'DB_URL',
    // Matches PostgreSQL, MongoDB, MySQL, Redis connection strings with credentials
    regex: /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis(?:s)?):\/\/[^\s"'`<>]+(?::[^\s"'`<>]+)?@[^\s"'`<>]+/gi,
  },
  {
    type: 'AWS_KEY',
    // Matches AWS Access Key ID
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    type: 'GITHUB_TOKEN',
    // Matches GitHub Personal Access Tokens and Fine-grained tokens
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/g,
  },
  {
    type: 'GOOGLE_API_KEY',
    // Matches Google Cloud / Gemini API Keys
    regex: /\bAIza[0-9A-Za-z-_]{35}\b/g,
  },
  {
    type: 'SUPABASE_KEY',
    // Matches Supabase Service or Anon JWT tokens
    regex: /\bsbp_[a-zA-Z0-9]{40}\b/g,
  },
  {
    type: 'JWT_TOKEN',
    // Matches standard 3-part base64url JWT tokens
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    type: 'GENERIC_SECRET',
    // Matches assignments like API_KEY = "xyz...", password = "xyz..."
    regex: /(?:api[_-]?key|secret|token|auth[_-]?token|password|bearer|private[_-]?key)\s*[:=]\s*["']([A-Za-z0-9_\-\.]{20,})["']/gi,
    isCaptureGroup: true,
  },
  {
    type: 'EMAIL',
    // Matches standard user and student emails
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  },
  {
    type: 'PHONE_NUMBER',
    // Matches formatted international and domestic telephone numbers (min 10 digits)
    regex: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  {
    type: 'STUDENT_ID',
    // Matches Student ID / Campus IDs preceded by ID markers
    regex: /\b(?:ID|Student\s*ID|SID|Roll)[:\s#]*([A-Za-z0-9-]{7,15})\b/gi,
    isCaptureGroup: true,
  },
];

/**
 * In-memory confidential scrubber.
 * Masks sensitive tokens with deterministic reversible placeholders.
 *
 * @param {string} rawPrompt - The prompt or source code to sanitize.
 * @param {object} [options] - Configuration options.
 * @returns {{ sanitizedPrompt: string, redactionMap: Map<string, string>, redactionCount: number }}
 */
export function sanitizePromptPayload(rawPrompt, options = {}) {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return { sanitizedPrompt: rawPrompt, redactionMap: new Map(), redactionCount: 0 };
  }

  // Enforce bounded input safety limit
  const promptToScan = rawPrompt.length > MAX_SCAN_LENGTH
    ? rawPrompt.slice(0, MAX_SCAN_LENGTH)
    : rawPrompt;

  let sanitized = promptToScan;
  const redactionMap = new Map(); // placeholder -> original
  const reverseMap = new Map();   // original -> placeholder
  let counter = 0;

  for (const rule of SANITIZATION_RULES) {
    sanitized = sanitized.replace(rule.regex, (fullMatch, captureGroup) => {
      const secretToRedact = rule.isCaptureGroup ? captureGroup : fullMatch;

      // Skip whitelisted educational samples or empty matches
      if (!secretToRedact || isWhitelisted(secretToRedact)) {
        return fullMatch;
      }

      // If we have already assigned a placeholder for this exact secret, reuse it
      if (reverseMap.has(secretToRedact)) {
        const existingPlaceholder = reverseMap.get(secretToRedact);
        return rule.isCaptureGroup
          ? fullMatch.replace(secretToRedact, existingPlaceholder)
          : existingPlaceholder;
      }

      counter++;
      const placeholder = `[REDACTED_${rule.type}_${counter}]`;
      redactionMap.set(placeholder, secretToRedact);
      reverseMap.set(secretToRedact, placeholder);

      return rule.isCaptureGroup
        ? fullMatch.replace(secretToRedact, placeholder)
        : placeholder;
    });
  }

  if (counter > 0) {
    console.log(`[Confidential Sanitizer] 🛡️ Scrubbed ${counter} sensitive credential(s) from AI prompt payload.`);
  }

  return {
    sanitizedPrompt: sanitized,
    redactionMap,
    redactionCount: counter,
  };
}

/**
 * Reversibly restores redacted placeholders in the LLM response
 * so the user receives a contextually accurate response without secrets having
 * leaked to external model providers.
 *
 * @param {string} text - Response text from the LLM.
 * @param {Map<string, string>} redactionMap - Mapping of placeholders to original secrets.
 * @returns {string} Desanitized text.
 */
export function desanitizeOutputPayload(text, redactionMap) {
  if (!text || typeof text !== 'string' || !redactionMap || redactionMap.size === 0) {
    return text;
  }

  let restored = text;
  for (const [placeholder, original] of redactionMap.entries()) {
    // Replace all occurrences of the placeholder with the original secret
    restored = restored.split(placeholder).join(original);
  }

  return restored;
}

export default {
  sanitizePromptPayload,
  desanitizeOutputPayload,
};
