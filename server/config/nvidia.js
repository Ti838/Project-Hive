// ── Groq AI Client (Free — No credit card needed) ──────────────────────────
// Sign up free at: https://console.groq.com
// Go to API Keys → Create API Key → copy the key starting with "gsk_..."
// Paste it in server/.env as GROQ_API_KEY=gsk_xxxxxxxxxxxx
//
// Free limits: 14,400 requests/day, 30 req/min — perfect for ProjectHive
// Model: llama-3.3-70b-versatile (best free model on Groq)

import OpenAI from 'openai';

let groqClient = null;

export function initializeGroq() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn('[ProjectHive] GROQ_API_KEY not set — AI features disabled.');
    console.warn('[ProjectHive] Get your free key at: https://console.groq.com');
    return null;
  }

  groqClient = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  console.log('[ProjectHive] ✅ Groq AI client initialized (LLaMA 3.3 70B — FREE)');
  return groqClient;
}

export function getGroqClient() {
  return groqClient;
}

export function isGroqReady() {
  return groqClient !== null;
}

// Keep backward compat with old NVIDIA NIM references
export const initializeNvidiaNIM = initializeGroq;
export const getNvidiaClient = getGroqClient;
