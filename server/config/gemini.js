// ── AI Provider Config — Groq (Primary) + Gemini (Fallback) ──────────────────
// Primary:  Groq (llama-3.3-70b-versatile — FREE — 6,000 req/day)
// Fallback: Google Gemini 2.0 Flash (FREE — 1,500 req/day, used for image/vision)
// If Groq fails, Gemini kicks in. Images always go to Gemini (vision support).

let geminiApiKey = null;
let groqApiKey = null;

export function initializeGemini() {
  // Initialize Gemini (primary)
  const gKey = process.env.GEMINI_API_KEY;
  if (gKey) {
    geminiApiKey = gKey;
    console.log('[ProjectHive] ✅ Google Gemini AI initialized (gemini-2.0-flash — FALLBACK + VISION)');
  } else {
    console.warn('[ProjectHive] ⚠️  GEMINI_API_KEY not set — Gemini disabled.');
  }

  // Initialize Groq (fallback)
  const qKey = process.env.GROQ_API_KEY;
  if (qKey) {
    groqApiKey = qKey;
    console.log('[ProjectHive] ✅ Groq AI initialized (llama-3.3-70b — PRIMARY)');
  } else {
    console.warn('[ProjectHive] ⚠️  GROQ_API_KEY not set — Groq fallback disabled.');
  }

  if (!gKey && !qKey) {
    console.warn('[ProjectHive] ❌ No AI provider configured — AI features disabled.');
    console.warn('[ProjectHive]    Gemini: https://aistudio.google.com/apikey');
    console.warn('[ProjectHive]    Groq:   https://console.groq.com/keys');
    return null;
  }

  return gKey || qKey;
}

export function getGeminiKey() { return geminiApiKey; }
export function getGroqKey() { return groqApiKey; }
export function isGeminiReady() { return geminiApiKey !== null; }
export function isGroqReady() { return groqApiKey !== null; }
export function isAIReady() { return geminiApiKey !== null || groqApiKey !== null; }

// Backward compat
export const initializeNvidiaNIM = initializeGemini;
export const initializeGroq = initializeGemini;
export const getNvidiaClient = () => geminiApiKey;
export const getGroqClient = () => groqApiKey;
