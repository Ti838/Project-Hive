// ── AI Controller — 3-Tier Multi-Model Cascading Fallback ───────────────────
// Tier 1: Groq Cloud (llama-3.3-70b-versatile, qwen) — Ultra-fast text & code
// Tier 2: Google Gemini Flash (gemini-2.5-flash, gemini-2.0-flash) — Vision & Text
// Tier 3: OpenRouter Free Router (openrouter/free) — Zero-Rate-Limit Defense
// Client Hardware: Browser Web Speech API (STT & TTS)

import {
  getGeminiKey,
  getGroqKey,
  getOpenRouterKey,
  isGeminiReady,
  isGroqReady,
  isOpenRouterReady,
  isAIReady,
} from '../config/gemini.js';
import {
  sanitizePromptPayload,
  desanitizeOutputPayload,
} from '../services/crypto/sanitizer.service.js';

// Verified working Groq models (Primary: llama-3.3-70b-versatile, Fast fallback: llama-3.1-8b-instant)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Active verified free-tier models on OpenRouter
const OPENROUTER_MODELS = [
  'openrouter/free',
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'nvidia/nemotron-3.5-lightning:free',
];

const OPENROUTER_VISION_MODELS = [
  'google/gemma-2-9b-it:free',
  'openrouter/free',
];

const GEMINI_BASE     = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE       = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// 9-second strict timeout per tier to prevent slow socket stalls
const TIER_TIMEOUT_MS = 9000;

// Rate limiter (per-user sliding window)
const rateLimitMap = new Map();
function checkLimit(key, max) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  let record = rateLimitMap.get(key);
  if (!record || (now - record.start) > windowMs) {
    record = { start: now, count: 0 };
  }
  if (record.count >= max) return false;
  record.count++;
  rateLimitMap.set(key, record);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap) {
    if (now - v.start > 3600000) rateLimitMap.delete(k);
  }
}, 30 * 60 * 1000);

/**
 * Robust fetch wrapper with strict abort timeout to enforce circuit breaking
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = TIER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutErr.name = 'TimeoutError';
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Tier 2: Google Gemini Flash (Vision & Text Fallback) ─────────────────────
async function callGemini(prompt, imageBase64, mimeType) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('GEMINI_NOT_CONFIGURED');

  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.8, topP: 0.9, maxOutputTokens: 3500 },
        }),
      }, TIER_TIMEOUT_MS);

      if (response.status === 429) {
        console.warn(`[AI] Gemini rate limit hit (429) on ${model} — cascading to next tier`);
        const e = new Error('GEMINI_RATE_LIMIT');
        e.status = 429;
        e.provider = 'gemini';
        throw e; // Break immediately to cascade
      }

      if (response.status === 503 || response.status === 502 || response.status === 504) {
        console.warn(`[AI] Gemini service unavailable (${response.status}) on ${model} — skipping`);
        continue;
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Gemini error ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text) {
        return { text, provider: 'gemini', model };
      }
    } catch (e) {
      lastError = e;
      if (e.status === 429) {
        throw e; // Cascade immediately to next tier
      }
      console.warn(`[AI] Gemini model ${model} failed (${e.message}) — trying next`);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ── Tier 1: Groq Cloud (llama-3.3-70b-versatile, llama-3.1-8b-instant) ──────
async function callGroq(prompt) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('GROQ_NOT_CONFIGURED');

  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetchWithTimeout(GROQ_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 3500,
        }),
      }, TIER_TIMEOUT_MS);

      if (response.status === 429) {
        console.warn(`[AI] Groq rate limit hit (429) on ${model} — cascading to Tier 2 (Gemini)`);
        const e = new Error('GROQ_RATE_LIMIT');
        e.status = 429;
        e.provider = 'groq';
        throw e; // Break immediately to cascade
      }

      if (response.status === 503 || response.status === 502 || response.status === 504) {
        console.warn(`[AI] Groq service unavailable (${response.status}) on ${model} — skipping`);
        continue;
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Groq error ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      const text = data?.choices?.[0]?.message?.content?.trim() || '';
      if (text) {
        return { text, provider: 'groq', model };
      }
    } catch (e) {
      lastError = e;
      if (e.status === 429) {
        throw e; // Cascade immediately
      }
      console.warn(`[AI] Groq model ${model} failed (${e.message}) — trying next`);
    }
  }

  throw lastError || new Error('All Groq models failed');
}

// ── Tier 3: OpenRouter Free Cascade (Zero-Rate-Limit Defense) ────────────────
async function callOpenRouter(prompt, imageBase64, mimeType) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_NOT_CONFIGURED');

  const modelsToTry = imageBase64 ? OPENROUTER_VISION_MODELS : OPENROUTER_MODELS;
  let lastError = null;

  let messageContent;
  if (imageBase64) {
    messageContent = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
        },
      },
      {
        type: 'text',
        text: prompt,
      },
    ];
  } else {
    messageContent = prompt;
  }

  for (const model of modelsToTry) {
    try {
      const response = await fetchWithTimeout(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://projecthive-bd.vercel.app',
          'X-Title': 'ProjectHive AI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: messageContent }],
          temperature: 0.7,
          max_tokens: 3500,
        }),
      }, TIER_TIMEOUT_MS);

      if (response.status === 429) {
        console.warn(`[AI] OpenRouter rate limit (429) on ${model} — skipping`);
        continue;
      }

      if (response.status === 503 || response.status === 502 || response.status === 504) {
        console.warn(`[AI] OpenRouter server error (${response.status}) on ${model} — skipping`);
        continue;
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `OpenRouter error ${response.status}`;
        if (errMsg.includes('model output must contain') || errMsg.includes('model output error')) {
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json().catch(() => null);
      if (data?.error) {
        const inlineErr = data.error?.message || JSON.stringify(data.error);
        if (inlineErr.includes('model output must contain') || inlineErr.includes('model output error')) {
          continue;
        }
        throw new Error(inlineErr);
      }

      const text = data?.choices?.[0]?.message?.content?.trim() || '';
      if (text) {
        return { text, provider: 'openrouter', model };
      }
    } catch (e) {
      lastError = e;
      console.warn(`[AI] OpenRouter model ${model} failed (${e.message}) — trying next`);
    }
  }

  throw lastError || new Error('All OpenRouter models failed');
}

// ── Multi-Tier AI Cascade Router (Groq -> Gemini -> OpenRouter) ─────────────
export async function callAI(prompt, imageBase64, mimeType) {
  // Phase 2 Confidential Computing: In-memory sanitization & reversible masking
  const { sanitizedPrompt, redactionMap, redactionCount } = sanitizePromptPayload(prompt);

  const geminiAvailable = isGeminiReady();
  const groqAvailable = isGroqReady();
  const openRouterAvailable = isOpenRouterReady();

  let rawResult = null;

  // 1. Multimodal Vision Priority: Gemini Flash (Tier 1) -> OpenRouter Vision (Tier 2)
  if (imageBase64) {
    if (geminiAvailable) {
      try {
        console.log('[AI] 👁️ Routing image to Tier 1: Gemini Flash (Vision)');
        rawResult = await callGemini(sanitizedPrompt, imageBase64, mimeType);
      } catch (geminiError) {
        console.warn(`[AI] ⚠️ Gemini Vision failed (${geminiError.message}) — cascading to OpenRouter Vision`);
      }
    }

    if (!rawResult && openRouterAvailable) {
      try {
        console.log('[AI] 👁️ Routing image to Tier 2: OpenRouter Vision (Fallback)');
        rawResult = await callOpenRouter(sanitizedPrompt, imageBase64, mimeType);
      } catch (orError) {
        console.error(`[AI] ❌ OpenRouter Vision also failed: ${orError.message}`);
      }
    }

    if (!rawResult) {
      throw new Error('Image analysis temporarily unavailable across all vision providers. Please try again or submit a text query.');
    }
  } else {
    // 2. Text / Code Cascade (Zero-Rate-Limit Defense):
    // Tier 1: Groq Cloud (llama-3.3-70b-versatile, llama-3.1-8b-instant)
    if (groqAvailable) {
      try {
        console.log('[AI] ⚡ Cascade Tier 1: Groq Cloud');
        rawResult = await callGroq(sanitizedPrompt);
        console.log(`[AI] ✅ Tier 1 (Groq - ${rawResult.model}) succeeded`);
      } catch (groqError) {
        console.warn(`[AI] ⚠️ Tier 1 (Groq) failed (${groqError.message}) — cascading to Tier 2 (Gemini)`);
      }
    }

    // Tier 2: Google Gemini Flash
    if (!rawResult && geminiAvailable) {
      try {
        console.log('[AI] ⚡ Cascade Tier 2: Google Gemini Flash');
        rawResult = await callGemini(sanitizedPrompt);
        console.log(`[AI] ✅ Tier 2 (Gemini - ${rawResult.model}) succeeded`);
      } catch (geminiError) {
        console.warn(`[AI] ⚠️ Tier 2 (Gemini) failed (${geminiError.message}) — cascading to Tier 3 (OpenRouter)`);
      }
    }

    // Tier 3: OpenRouter Free Cascade
    if (!rawResult && openRouterAvailable) {
      try {
        console.log('[AI] ⚡ Cascade Tier 3: OpenRouter Free Cascade');
        rawResult = await callOpenRouter(sanitizedPrompt);
        console.log(`[AI] ✅ Tier 3 (OpenRouter - ${rawResult.model}) succeeded`);
      } catch (orError) {
        console.error(`[AI] ❌ Tier 3 (OpenRouter) failed: ${orError.message}`);
      }
    }

    if (!rawResult) {
      throw new Error('All AI providers (Groq, Gemini, OpenRouter) are temporarily unavailable or rate-limited. Please retry in a moment.');
    }
  }

  // Restore any redacted placeholders in the generated output
  const restoredText = desanitizeOutputPayload(rawResult.text, redactionMap);

  return {
    ...rawResult,
    text: restoredText,
    security: {
      confidentialScrubbed: true,
      redactionsCount: redactionCount,
    },
  };
}


// ── Generate project ideas ───────────────────────────────────────────────────
async function generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints }) {
  const skillsList = Array.isArray(skills)
    ? skills.filter(Boolean).join(', ')
    : (skills || 'General programming');

  const prompt = `You are an expert university project advisor.
Generate exactly 5 unique and innovative project ideas for university students.

Requirements:
- Domain: ${domain}
- Team Skills: ${skillsList}
- Team Size: ${teamSize || 3} people
- Timeline: ${timelineWeeks || 8} weeks
- Constraints: ${constraints || 'None'}

IMPORTANT: Respond with ONLY a valid JSON array. No markdown, no explanation, no \`\`\`json blocks.
Each object must have exactly these fields:
{
  "name": "Short catchy project name",
  "description": "2-3 sentences explaining what it does and why it matters",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "techStack": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "difficulty": "Beginner" or "Intermediate" or "Advanced",
  "innovationScore": <integer 1-10>,
  "estimatedWeeks": <integer>
}

Output the raw JSON array only. Start with [ and end with ].`;

  const result = await callAI(prompt);

  // Parse JSON with multi-layered extraction
  let content = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let ideas = null;
  try {
    ideas = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        ideas = JSON.parse(match[0]);
      } catch (_) {}
    }
  }

  if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
    throw new Error('AI returned an unstructured response. Please try generating again.');
  }

  return {
    ideas: ideas.slice(0, 5).map((idea, i) => ({
      name:           idea.name || idea.title || `Project Idea ${i + 1}`,
      description:    idea.description || '',
      features:       Array.isArray(idea.features) ? idea.features.slice(0, 4) : [],
      techStack:      Array.isArray(idea.techStack || idea.tech_stack)
                        ? (idea.techStack || idea.tech_stack).slice(0, 7) : [],
      difficulty:     idea.difficulty || 'Intermediate',
      innovationScore: Number(idea.innovationScore || idea.noveltyScore || 7),
      estimatedWeeks:  Number(idea.estimatedWeeks || timelineWeeks || 8),
    })),
    provider: result.provider,
    model: result.model,
  };
}

// ── Auth endpoint: Generate ideas (30 req/hr per user) ───────────────────────
export async function generateProjectIdeas(req, res, next) {
  try {
    if (!isAIReady()) {
      return res.status(503).json({ error: 'AI service not configured. Add GEMINI_API_KEY or GROQ_API_KEY.' });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`user-${userId}`, 30)) {
      return res.status(429).json({ error: 'Rate limit: 30 AI requests per hour per user.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const result = await generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints });
    console.log(`[AI] ✅ Generated ${result.ideas.length} ideas via ${result.provider} (${result.model}) for user: ${userId}`);

    return res.json({
      ok: true,
      ideas: result.ideas,
      model: result.model,
      provider: result.provider,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI] Generate ideas error:', error.message);
    if (error.status === 429) return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment.' });
    return res.status(error.status || 500).json({ error: error.message || 'Failed to generate project ideas.' });
  }
}

// ── Public endpoint (15 req/hr per IP) ───────────────────────────────────────
export async function generateProjectIdeasPublic(req, res, next) {
  try {
    if (!isAIReady()) {
      return res.status(503).json({ error: 'AI service not configured.' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkLimit(`ip-${ip}`, 15)) {
      return res.status(429).json({ error: 'Rate limit: 15 free generations/hour.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const result = await generateIdeas({
      domain, skills: skills || 'General programming',
      teamSize: teamSize || 3, timelineWeeks: timelineWeeks || 8, constraints,
    });

    return res.json({
      ok: true,
      ideas: result.ideas,
      model: result.model,
      provider: result.provider,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI] Public ideas generation error:', error.message);
    if (error.status === 429) return res.status(429).json({ error: 'AI rate limit. Try again shortly.' });
    return res.status(error.status || 500).json({ error: error.message || 'Failed to generate project ideas.' });
  }
}

// ── Chat endpoint (text + image — 50 req/hr per user) ────────────────────────
export async function chatWithAI(req, res, next) {
  try {
    if (!isAIReady()) {
      return res.status(503).json({ error: 'AI service not configured. Please configure GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.' });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`chat-${userId}`, 60)) {
      return res.status(429).json({ error: 'Rate limit: 60 AI requests per hour.' });
    }

    const { message, imageBase64, mimeType, context } = req.body;
    if (!message?.trim() && !imageBase64) {
      return res.status(400).json({ error: 'Message or image attachment is required.' });
    }

    let routeContext = '';
    if (context?.currentRoute) {
      routeContext = `\nThe student is currently on the page: ${context.currentRoute}. Tailor your advice to this context if relevant.`;
    }
    if (context?.projectId) {
      routeContext += `\nReferenced Project ID: ${context.projectId}.`;
    }
    if (context?.teamId) {
      routeContext += `\nReferenced Squad ID: ${context.teamId}.`;
    }

    const systemPrompt = `You are HiveMind — Principal Full-Stack & CSE Project Mentor for ProjectHive.
You are an elite software architect, systems designer, and senior engineering mentor.
You specialize in:
- Production-grade debugging with exact syntax corrections (Next.js App Router, React 19, TypeScript, Tailwind, Express, PostgreSQL, Supabase, LiveKit SFU, Socket.IO).
- Designing clean, normalized PostgreSQL/Supabase database schemas with indexes, foreign keys, and Row Level Security (RLS) policies.
- Crafting high-converting, LinkedIn/YCombinator-grade project pitches, problem-solution statements, and value propositions.
- Generating comprehensive, production-standard GitHub READMEs with architecture diagrams, setup instructions, badges, and API docs.
- Analyzing architectural diagrams, ER diagrams, and user interface screenshots with actionable, structured engineering feedback.
${routeContext}
${imageBase64 ? '\nThe user has provided an image/diagram/screenshot. Analyze it thoroughly, point out architectural details, bugs, or UX improvements, and provide actionable next steps.' : ''}

Guidelines:
- Provide high-impact, direct, production-grade technical guidance.
- When generating code, use clean Markdown syntax with language identifier (e.g. \`\`\`tsx, \`\`\`sql, \`\`\`bash, or \`\`\`typescript).
- Keep explanations clear, structured with concise bullet points, and free of fluff.
- If providing SQL, optimize for PostgreSQL/Supabase with CREATE TABLE, constraints, indexes, and RLS policies where applicable.`;

    const result = await callAI(prompt, imageBase64, mimeType);

    if (result.security?.confidentialScrubbed) {
      res.setHeader('x-confidential-scrubbed', 'true');
      res.setHeader('x-confidential-redactions', String(result.security.redactionsCount || 0));
    }

    return res.json({
      ok: true,
      reply: result.text,
      provider: result.provider,
      model: result.model,
      security: result.security,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HiveMind AI] Chat error:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment.' });
    }
    return res.status(500).json({ error: error.message || 'Hive AI request failed. Please try again.' });
  }
}

// ── Centralized Hive AI Capability Execution ─────────────────────────────────
// Supports all 11 unified capabilities through one standard API contract
export async function executeHiveAICapability(req, res, next) {
  try {
    if (!isAIReady()) {
      return res.status(503).json({ error: 'Hive AI service is currently unavailable. Ensure GROQ_API_KEY or GEMINI_API_KEY is configured.' });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`hiveai-${userId}`, 60)) {
      return res.status(429).json({ error: 'Rate limit reached: 60 Hive AI operations per hour. Please wait a moment.' });
    }

    const {
      capability = 'copilot_chat',
      prompt: userPrompt = '',
      parameters = {},
      context = {},
      imageBase64,
      mimeType
    } = req.body;

    if (!userPrompt?.trim() && !imageBase64 && !parameters.domain && !parameters.topic) {
      return res.status(400).json({ error: 'A prompt, topic, or file attachment is required.' });
    }

    // Capability-Specific System Prompt Builder
    let systemInstruction = `You are Hive AI — the Central Engineering Intelligence Layer for ProjectHive.
You provide minimal, authoritative, production-grade engineering advice, system architectures, and technical artifacts.
Do not produce boilerplate filler or generic disclaimers. Focus on actionable, structured output.`;

    switch (capability) {
      case 'project_generator':
        systemInstruction = `You are Hive AI Project Generator.
Create a complete, production-grade engineering blueprint for a university/hackathon software project.
Structure your response into clear, distinct sections:
### 1. Problem Statement & Core Value
### 2. MVP Feature Scope
### 3. Architecture & Data Flow
### 4. Recommended Tech Stack
### 5. Step-by-Step Implementation Milestones (Week-by-Week)
### 6. Database Schema Overview (PostgreSQL/Supabase)
### 7. Technical Risks & Testing Strategy
Use clean Markdown with bold headers, bullet lists, and code fences where helpful.`;
        break;

      case 'idea_analyzer':
        systemInstruction = `You are Hive AI Idea Analyzer.
Analyze the submitted software project concept thoroughly.
Provide:
### 1. Executive Summary & Problem-Solution Fit
### 2. Novelty & Innovation Score (Rate 1-10 with rationale)
### 3. Technical Feasibility & Complexity Level (Beginner / Intermediate / Advanced)
### 4. Key Strengths & Competitive Edge
### 5. Potential Pitfalls & Technical Risks
### 6. Three Actionable Improvement Recommendations`;
        break;

      case 'project_critic':
        systemInstruction = `You are Hive AI Project Critic.
Act as a Principal Software Architect reviewing a project proposal, codebase, or architecture.
Provide constructive, rigorous critique:
### 1. Overall Architectural Assessment
### 2. Critical Security & Performance Vulnerabilities (Priority: HIGH)
### 3. Missing Edge Cases & Scalability Bottlenecks (Priority: MEDIUM)
### 4. Code Quality & UX Refinements (Priority: LOW)
### 5. Final Recommendations & Verification Checklist`;
        break;

      case 'research_assistant':
        systemInstruction = `You are Hive AI Research Assistant.
Provide a deep technical investigation and comparative analysis on the requested topic.
Structure:
### 1. Core Technical Fundamentals
### 2. Technology / Architecture Comparison Matrix
### 3. Trade-offs & Production Considerations (Latency, Cost, DX, Scalability)
### 4. Recommended Industry Best Practices
### 5. Verified Technical References & Documentation Pointers`;
        break;

      case 'documentation_ai':
        systemInstruction = `You are Hive AI Documentation Specialist.
Generate comprehensive, production-standard documentation (e.g. GitHub README, API Reference, Architecture Guide).
Include:
- Project title & catchy badges
- Overview & features list
- Tech stack overview
- Installation & environment configuration (.env variables)
- API Route reference table with request/response examples
- License & contributing guidelines
Return ready-to-use Markdown formatted inside clean code blocks.`;
        break;

      case 'code_assistant':
        systemInstruction = `You are Hive AI Code Assistant & Debugger.
Analyze the code snippet or technical challenge.
Provide:
### 1. Root Cause & Bug Diagnosis
### 2. Corrected, Production-Ready Code (Full syntax-highlighted block)
### 3. Key Edge Cases Handled & Complexity (Time / Space)
### 4. Recommended Unit Tests (Jest / Vitest / PyTest)`;
        break;

      case 'architecture_design':
        systemInstruction = `You are Hive AI Architecture & System Designer.
Design robust, scalable system topology and data pipelines.
Include:
### 1. High-Level Architecture Topology (Clients, Gateways, Microservices/Monolith, Cache, DB)
### 2. Data Flow & Event Lifecycle
### 3. Database ER Model & Indexing Strategy
### 4. Caching & Realtime Layer (Redis, Socket.IO, WebRTC SFU)
### 5. Deployment & CI/CD Pipeline Blueprint`;
        break;

      case 'project_health':
        systemInstruction = `You are Hive AI Project Health Assessor.
Evaluate the current project status, team deliverables, and velocity.
Provide:
### 1. Overall Project Health Status (HEALTHY · ON TRACK / AT RISK / ACTION REQUIRED)
### 2. Blocker Analysis & Critical Path Bottlenecks
### 3. Code & Documentation Readiness
### 4. Priority Tasks for This Sprint`;
        break;

      case 'team_ai':
        systemInstruction = `You are Hive AI Team Collaboration & Skill Gap Analyzer.
Analyze team composition, member skills, and project requirements.
Provide:
### 1. Team Skill Matrix & Coverage
### 2. Identified Skill Gaps (Roles Needed, e.g. Backend Engineer, UI/UX Designer)
### 3. Recommended Task Distribution & Ownership
### 4. Collaboration Best Practices for This Squad`;
        break;

      case 'career_ai':
        systemInstruction = `You are Hive AI Career & Technical Identity Advisor.
Transform student engineering builds into high-impact portfolio assets.
Provide:
### 1. 30-Second Elevator Pitch (YCombinator & Recruiter Ready)
### 2. High-Impact Resume / Portfolio Bullet Points (STAR Method: Situation, Task, Action, Result)
### 3. Recommended Technical Skills to Highlight
### 4. Follow-up Interview Talking Points & Deep-Dive Questions to Prepare For`;
        break;

      default:
        systemInstruction = `You are Hive AI — Senior Engineering Copilot for ProjectHive.
Provide direct, clean, production-grade technical mentorship and guidance.`;
        break;
    }

    // Build context string
    let contextBlock = '';
    if (context.currentRoute) contextBlock += `\n[Context] Current Workspace: ${context.currentRoute}`;
    if (context.projectName) contextBlock += `\n[Context] Project: ${context.projectName}`;
    if (context.techStack) contextBlock += `\n[Context] Tech Stack: ${Array.isArray(context.techStack) ? context.techStack.join(', ') : context.techStack}`;
    if (context.teamName) contextBlock += `\n[Context] Team: ${context.teamName}`;

    // Combine prompt
    const fullPrompt = `${systemInstruction}\n${contextBlock}\n\nTask / User Input:\n${userPrompt || JSON.stringify(parameters, null, 2)}`;

    const result = await callAI(fullPrompt, imageBase64, mimeType);

    if (result.security?.confidentialScrubbed) {
      res.setHeader('x-confidential-scrubbed', 'true');
      res.setHeader('x-confidential-redactions', String(result.security.redactionsCount || 0));
    }

    return res.json({
      ok: true,
      capability,
      output: result.text,
      provider: result.provider,
      model: result.model,
      security: result.security,
      timestamp: new Date().toISOString(),
      metadata: {
        tokensEstimated: Math.round(result.text.length / 4),
        capability,
      }
    });
  } catch (error) {
    console.error('[Hive AI Execution] Error:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Hive AI rate limit reached. Please wait a moment.' });
    }
    return res.status(500).json({
      error: error.message?.includes('AI_NOT_CONFIGURED')
        ? 'Hive AI service is initializing or no API key is configured on the server. Please check GROQ_API_KEY in Render dashboard.'
        : (error.message || 'Hive AI request failed. Please try again.')
    });
  }
}

