// ── AI Controller — Groq (Primary) + Gemini (Fallback/Vision) ───────────────
// Primary:  Groq llama-3.3-70b-versatile — Text (fast & reliable)
// Fallback: Google Gemini 2.5 Flash — Text + Vision (image analysis)
// Automatic failover: if Groq fails → Gemini takes over. Images always go to Gemini.

import { getGeminiKey, getGroqKey, isGeminiReady, isGroqReady, isAIReady } from '../config/gemini.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GEMINI_BASE   = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE     = 'https://api.groq.com/openai/v1/chat/completions';

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

// ── Call Gemini API ──────────────────────────────────────────────────────────
async function callGemini(prompt, imageBase64, mimeType) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('GEMINI_NOT_CONFIGURED');

  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.8, topP: 0.9, maxOutputTokens: 3000 },
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
      const e = new Error(err?.error?.message || `Gemini error ${response.status}`);
      e.status = response.status;
      e.provider = 'gemini';
      throw e;
    }

    const data = await response.json();
    return {
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '',
      provider: 'gemini',
      model: GEMINI_MODEL,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Call Groq API (OpenAI-compatible) ────────────────────────────────────────
async function callGroq(prompt) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('GROQ_NOT_CONFIGURED');

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
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 3000,
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
      const e = new Error(err?.error?.message || `Groq error ${response.status}`);
      e.status = response.status;
      e.provider = 'groq';
      throw e;
    }

    const data = await response.json();
    return {
      text: data?.choices?.[0]?.message?.content?.trim() || '',
      provider: 'groq',
      model: GROQ_MODEL,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Smart AI Call with Automatic Fallback ────────────────────────────────────
// Priority: Groq (PRIMARY) → Gemini (FALLBACK)
// Groq is fast & reliable. Gemini is used for image analysis (vision) or if Groq fails.
async function callAI(prompt, imageBase64, mimeType) {
  const geminiAvailable = isGeminiReady();
  const groqAvailable = isGroqReady();

  // If image is provided, must use Gemini (Groq doesn't support vision)
  if (imageBase64) {
    if (geminiAvailable) {
      return await callGemini(prompt, imageBase64, mimeType);
    }
    throw new Error('Image analysis requires Gemini API. Please configure GEMINI_API_KEY.');
  }

  // Try Groq first (primary — fast & reliable)
  if (groqAvailable) {
    try {
      return await callGroq(prompt);
    } catch (groqError) {
      console.warn(`[AI] ⚠️ Groq failed (${groqError.message}) — switching to Gemini fallback`);

      // If Gemini is available, fall back to it
      if (geminiAvailable) {
        try {
          const result = await callGemini(prompt);
          console.log('[AI] ✅ Gemini fallback succeeded');
          return result;
        } catch (geminiError) {
          console.error(`[AI] ❌ Gemini fallback also failed: ${geminiError.message}`);
          throw geminiError; // Both failed
        }
      }

      throw groqError; // No fallback available
    }
  }

  // Groq not available, try Gemini directly
  if (geminiAvailable) {
    return await callGemini(prompt);
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
      return res.status(503).json({ error: 'AI service not configured.' });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`chat-${userId}`, 50)) {
      return res.status(429).json({ error: 'Rate limit: 50 AI chats per hour.' });
    }

    const { message, imageBase64, mimeType } = req.body;
    if (!message?.trim() && !imageBase64) {
      return res.status(400).json({ error: 'Message or image is required.' });
    }

    const systemPrompt = `You are ProjectHive AI — a helpful assistant for university students working on software projects.
Answer questions about project ideas, tech stacks, team building, and academic project planning.
${imageBase64 ? 'The user has attached an image. Analyze it and provide relevant project ideas or insights.' : ''}
Be concise (max 5-6 lines), friendly, and practical. Use emojis sparingly.`;

    const prompt = systemPrompt + (message ? `\n\nUser: ${message}` : '\n\nPlease analyze this image.');
    const result = await callAI(prompt, imageBase64, mimeType);

    return res.json({
      ok: true,
      reply: result.text,
      provider: result.provider,
    });
  } catch (error) {
    console.error('[AI] Chat error:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit. Please wait a moment.' });
    }
    next(error);
  }
}
