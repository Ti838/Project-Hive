// ── AI Controller — Google Gemini Only (FREE — 1,500 req/day) ───────────────
// Model: gemini-2.0-flash — Text + Vision (image analysis)
// Free limits: 1,500 req/day, 15 req/min, 1M tokens/min

import { getGeminiKey, isGeminiReady } from '../config/gemini.js';

const MODEL = 'gemini-2.0-flash';
const BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

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
  if (!apiKey) throw new Error('AI_NOT_CONFIGURED');

  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const url = `${BASE}/${MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.8, topP: 0.9, maxOutputTokens: 3000 },
    }),
  });

  if (response.status === 429) {
    const e = new Error('RATE_LIMIT');
    e.status = 429;
    throw e;
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
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

  const text = await callGemini(prompt);

  // Parse JSON
  let content = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let ideas;
  try {
    ideas = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI returned invalid format. Please try again.');
    ideas = JSON.parse(match[0]);
  }

  if (!Array.isArray(ideas)) ideas = [ideas];

  return ideas.slice(0, 5).map((idea, i) => ({
    name:           idea.name || idea.title || `Project Idea ${i + 1}`,
    description:    idea.description || '',
    features:       Array.isArray(idea.features) ? idea.features.slice(0, 4) : [],
    techStack:      Array.isArray(idea.techStack || idea.tech_stack)
                      ? (idea.techStack || idea.tech_stack).slice(0, 7) : [],
    difficulty:     idea.difficulty || 'Intermediate',
    innovationScore: Number(idea.innovationScore || idea.noveltyScore || 7),
    estimatedWeeks:  Number(idea.estimatedWeeks || timelineWeeks || 8),
  }));
}

// ── Auth endpoint: Generate ideas (30 req/hr per user) ───────────────────────
export async function generateProjectIdeas(req, res, next) {
  try {
    if (!isGeminiReady()) {
      return res.status(503).json({ error: 'AI service not configured. Add GEMINI_API_KEY.' });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`user-${userId}`, 30)) {
      return res.status(429).json({ error: 'Rate limit: 30 AI requests per hour per user.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const ideas = await generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints });
    console.log(`[AI] ✅ Generated ${ideas.length} ideas for user: ${userId}`);

    return res.json({
      ok: true, ideas, model: MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI] Error:', error.message);
    if (error.status === 429) return res.status(429).json({ error: 'Gemini rate limit. Wait a moment.' });
    next(error);
  }
}

// ── Public endpoint (15 req/hr per IP) ───────────────────────────────────────
export async function generateProjectIdeasPublic(req, res, next) {
  try {
    if (!isGeminiReady()) {
      return res.status(503).json({ error: 'AI service not configured.' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkLimit(`ip-${ip}`, 15)) {
      return res.status(429).json({ error: 'Rate limit: 15 free generations/hour.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const ideas = await generateIdeas({
      domain, skills: skills || 'General programming',
      teamSize: teamSize || 3, timelineWeeks: timelineWeeks || 8, constraints,
    });

    return res.json({ ok: true, ideas, model: MODEL, generatedAt: new Date().toISOString() });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ error: 'AI rate limit. Try again shortly.' });
    next(error);
  }
}

// ── Chat endpoint (text + image — 50 req/hr per user) ────────────────────────
export async function chatWithAI(req, res, next) {
  try {
    if (!isGeminiReady()) {
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
    const reply = await callGemini(prompt, imageBase64, mimeType);

    return res.json({ ok: true, reply });
  } catch (error) {
    console.error('[AI] Chat error:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit. Please wait a moment.' });
    }
    next(error);
  }
}
