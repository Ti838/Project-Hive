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

// Verified working Groq models (as of 2025)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Note: "openrouter/free" is NOT a valid model ID — removed.
// These are actual free-tier model IDs on OpenRouter.
const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
];

const OPENROUTER_VISION_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'qwen/qwen2.5-vl-7b-instruct:free',
];

const GEMINI_BASE     = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE       = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

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

// ── Call Gemini API with model fallback ─────────────────────────────────────
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.8, topP: 0.9, maxOutputTokens: 3500 },
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const e = new Error('GEMINI_RATE_LIMIT');
        e.status = 429;
        e.provider = 'gemini';
        throw e;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini error ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text) {
        return { text, provider: 'gemini', model };
      }
    } catch (e) {
      lastError = e;
      console.warn(`[AI] Gemini model ${model} failed: ${e.message} — trying next`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ── Call Groq API with multi-model fallback ─────────────────────────────────
async function callGroq(prompt) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('GROQ_NOT_CONFIGURED');

  let lastError = null;

  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(GROQ_BASE, {
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
        signal: controller.signal,
      });

      if (response.status === 429) {
        const e = new Error('GROQ_RATE_LIMIT');
        e.status = 429;
        e.provider = 'groq';
        throw e;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Groq error ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || '';
      if (text) {
        return { text, provider: 'groq', model };
      }
    } catch (e) {
      lastError = e;
      console.warn(`[AI] Groq model ${model} failed: ${e.message} — trying next`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('All Groq models failed');
}

// ── Call OpenRouter API with multi-model fallback ───────────────────────────
async function callOpenRouter(prompt, imageBase64, mimeType) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_NOT_CONFIGURED');

  const modelsToTry = imageBase64 ? OPENROUTER_VISION_MODELS : OPENROUTER_MODELS;
  let lastError = null;

  // Build message content (multimodal or standard text)
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(OPENROUTER_BASE, {
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
        signal: controller.signal,
      });

      if (response.status === 429) {
        const e = new Error('OPENROUTER_RATE_LIMIT');
        e.status = 429;
        e.provider = 'openrouter';
        throw e;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errMsg = err?.error?.message || `OpenRouter error ${response.status}`;
        // Treat "model output must contain either output text or tool calls" as a skip
        if (errMsg.includes('model output must contain') || errMsg.includes('model output error')) {
          console.warn(`[AI] OpenRouter model ${model} returned empty output — skipping to next model`);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      // Check for inline error in the response body (some OpenRouter models return 200 with error)
      if (data?.error) {
        const inlineErr = data.error?.message || JSON.stringify(data.error);
        if (inlineErr.includes('model output must contain') || inlineErr.includes('model output error')) {
          console.warn(`[AI] OpenRouter model ${model} inline error (empty output) — skipping`);
          continue;
        }
        throw new Error(inlineErr);
      }

      const text = data?.choices?.[0]?.message?.content?.trim() || '';
      const finishReason = data?.choices?.[0]?.finish_reason;
      if (text) {
        return { text, provider: 'openrouter', model };
      }
      // Empty content — model produced nothing, skip to next
      console.warn(`[AI] OpenRouter model ${model} returned empty content (finish_reason: ${finishReason}) — skipping`);
    } catch (e) {
      lastError = e;
      console.warn(`[AI] OpenRouter model ${model} failed: ${e.message} — trying next`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('All OpenRouter models failed');
}

// ── Smart AI Cascading Router (Groq -> Gemini -> OpenRouter) ────────────────
async function callAI(prompt, imageBase64, mimeType) {
  const geminiAvailable = isGeminiReady();
  const groqAvailable = isGroqReady();
  const openRouterAvailable = isOpenRouterReady();

  // 1. Multimodal Vision Priority: Gemini Flash -> OpenRouter Free
  if (imageBase64) {
    if (geminiAvailable) {
      try {
        console.log('[AI] 👁️ Routing image to Gemini Flash (Vision)');
        return await callGemini(prompt, imageBase64, mimeType);
      } catch (geminiError) {
        console.warn(`[AI] ⚠️ Gemini Vision failed (${geminiError.message}) — cascading to OpenRouter Vision`);
      }
    }

    if (openRouterAvailable) {
      try {
        console.log('[AI] 👁️ Routing image to OpenRouter Vision (Fallback)');
        return await callOpenRouter(prompt, imageBase64, mimeType);
      } catch (orError) {
        console.error(`[AI] ❌ OpenRouter Vision also failed: ${orError.message}`);
        throw orError;
      }
    }

    throw new Error('Image analysis failed or no vision provider configured.');
  }

  // 2. Text / Code Cascade (Zero-Rate-Limit Defense):
  // Tier 1: Groq Cloud (llama-3.3-70b-versatile, qwen)
  if (groqAvailable) {
    try {
      return await callGroq(prompt);
    } catch (groqError) {
      console.warn(`[AI] ⚠️ Tier 1 (Groq) failed (${groqError.message}) — cascading to Tier 2 (Gemini)`);
    }
  }

  // Tier 2: Google Gemini Flash
  if (geminiAvailable) {
    try {
      const result = await callGemini(prompt);
      console.log('[AI] ✅ Tier 2 (Gemini) succeeded');
      return result;
    } catch (geminiError) {
      console.warn(`[AI] ⚠️ Tier 2 (Gemini) failed (${geminiError.message}) — cascading to Tier 3 (OpenRouter)`);
    }
  }

  // Tier 3: OpenRouter Free Router
  if (openRouterAvailable) {
    try {
      const result = await callOpenRouter(prompt);
      console.log('[AI] ✅ Tier 3 (OpenRouter) succeeded');
      return result;
    } catch (orError) {
      console.error(`[AI] ❌ Tier 3 (OpenRouter) failed: ${orError.message}`);
      throw orError;
    }
  }

  throw new Error('AI_NOT_CONFIGURED');
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

  // Parse JSON
  let content = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let ideas;
  try {
    ideas = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI returned invalid format. Please try again.');
    ideas = JSON.parse(match[0]);
  }

  if (!Array.isArray(ideas)) ideas = [ideas];

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
    console.error('[AI] Error:', error.message);
    if (error.status === 429) return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment.' });
    next(error);
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
    if (error.status === 429) return res.status(429).json({ error: 'AI rate limit. Try again shortly.' });
    next(error);
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

    const prompt = systemPrompt + (message ? `\n\nUser Query:\n${message}` : '\n\nPlease analyze the attached diagram/screenshot and provide architectural/engineering insights.');
    const result = await callAI(prompt, imageBase64, mimeType);

    return res.json({
      ok: true,
      reply: result.text,
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HiveMind AI] Chat error:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment.' });
    }
    next(error);
  }
}
