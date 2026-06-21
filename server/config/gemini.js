// ── AI Provider Config (Gemini + Groq — both FREE) ─────────────────────────
// Gemini: 1,500 req/day, 15 req/min — supports Vision
// Groq:   14,400 req/day, 30 req/min — supports Vision (llama-3.2-90b)
// Strategy: Try Gemini first, fallback to Groq on rate limit

let geminiApiKey = null;
let groqApiKey = null;

export function initializeGemini() {
  geminiApiKey = process.env.GEMINI_API_KEY || null;
  groqApiKey = process.env.GROQ_API_KEY || null;

  if (geminiApiKey) {
    console.log('[ProjectHive] ✅ Gemini AI ready (gemini-2.0-flash — FREE)');
  }
  if (groqApiKey) {
    console.log('[ProjectHive] ✅ Groq AI ready (llama-3.3-70b — FREE fallback)');
  }
  if (!geminiApiKey && !groqApiKey) {
    console.warn('[ProjectHive] ⚠️  No AI keys set — AI features disabled.');
    console.warn('[ProjectHive]    Gemini: https://aistudio.google.com/apikey');
    console.warn('[ProjectHive]    Groq:   https://console.groq.com/keys');
  }

  return geminiApiKey || groqApiKey;
}

export function getGeminiKey() { return geminiApiKey; }
export function getGroqKey() { return groqApiKey; }
export function isGeminiReady() { return !!(geminiApiKey || groqApiKey); }

// Backward compat
export const initializeNvidiaNIM = initializeGemini;
export const initializeGroq = initializeGemini;
export const getNvidiaClient = () => geminiApiKey;
export const getGroqClient = () => groqApiKey;
