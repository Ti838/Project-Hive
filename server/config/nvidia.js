// ── Google Gemini AI Client (FREE — works with any Gmail) ───────────────────
// Free limits: 1,500 requests/day, 15 req/min
// Model: gemini-1.5-flash (fast, smart, free)
// Get your key at: https://aistudio.google.com/apikey

let geminiApiKey = null;

export function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[ProjectHive] ⚠️  GEMINI_API_KEY not set — AI features disabled.');
    console.warn('[ProjectHive]    Get free key at: https://aistudio.google.com/apikey');
    return null;
  }

  geminiApiKey = apiKey;
  console.log('[ProjectHive] ✅ Google Gemini AI initialized (gemini-2.0-flash — FREE)');
  return apiKey;
}

export function getGeminiKey() {
  return geminiApiKey;
}

export function isGeminiReady() {
  return geminiApiKey !== null;
}

// Backward compat
export const initializeNvidiaNIM = initializeGemini;
export const initializeGroq = initializeGemini;
export const getNvidiaClient = () => geminiApiKey;
export const getGroqClient = () => geminiApiKey;
