// ── AI Provider Config — Groq (Primary) + Gemini (Vision/Fallback) + OpenRouter (Free Cascade)
// Tier 1: Groq (llama-3.3-70b-versatile, qwen) — FREE — fast text/code
// Tier 2: Google Gemini 2.0/2.5 Flash — FREE — Vision + Text Fallback
// Tier 3: OpenRouter Free Router (openrouter/free) — Zero-Cost Cloud Redundancy

let geminiApiKey = null;
let groqApiKey = null;
let openRouterApiKey = null;

export function initializeGemini() {
  // Initialize Gemini
  const gKey = process.env.GEMINI_API_KEY;
  if (gKey) {
    geminiApiKey = gKey;
    console.log('[ProjectHive] ✅ Google Gemini AI initialized (gemini-2.0-flash — VISION & FALLBACK)');
  } else {
    console.warn('[ProjectHive] ⚠️  GEMINI_API_KEY not set — Gemini disabled.');
  }

  // Initialize Groq
  const qKey = process.env.GROQ_API_KEY;
  if (qKey) {
    groqApiKey = qKey;
    console.log('[ProjectHive] ✅ Groq AI initialized (llama-3.3-70b — PRIMARY)');
  } else {
    console.warn('[ProjectHive] ⚠️  GROQ_API_KEY not set — Groq fallback disabled.');
  }

  // Initialize OpenRouter
  const oKey = process.env.OPENROUTER_API_KEY;
  if (oKey) {
    openRouterApiKey = oKey;
    console.log('[ProjectHive] ✅ OpenRouter Free Router initialized (CASCADE TIER 3)');
  } else {
    console.warn('[ProjectHive] ⚠️  OPENROUTER_API_KEY not set — OpenRouter cascade disabled.');
  }

  if (!gKey && !qKey && !oKey) {
    console.warn('[ProjectHive] ❌ No AI provider configured — AI features disabled.');
    return null;
  }

  return gKey || qKey || oKey;
}

export function getGeminiKey() { return geminiApiKey; }
export function getGroqKey() { return groqApiKey; }
export function getOpenRouterKey() { return openRouterApiKey; }
export function isGeminiReady() { return geminiApiKey !== null; }
export function isGroqReady() { return groqApiKey !== null; }
export function isOpenRouterReady() { return openRouterApiKey !== null; }
export function isAIReady() { return geminiApiKey !== null || groqApiKey !== null || openRouterApiKey !== null; }

// Backward compat
export const initializeAI = initializeGemini;
export const initializeNvidiaNIM = initializeGemini;
export const initializeGroq = initializeGemini;
export const getNvidiaClient = () => geminiApiKey;
export const getGroqClient = () => groqApiKey;

