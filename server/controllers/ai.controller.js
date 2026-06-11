// ── AI Controller — Google Gemini (gemini-2.0-flash, FREE) ─────────────────
// Uses Google's REST API directly — no extra SDK needed, just fetch()
import { getGeminiKey, isGeminiReady } from '../config/gemini.js';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

// Rate limiter
const rateLimitMap = new Map();
function checkLimit(key, max) {
  const hourKey = `${key}-${new Date().getHours()}`;
  const count   = rateLimitMap.get(hourKey) || 0;
  if (count >= max) return false;
  rateLimitMap.set(hourKey, count + 1);
  return true;
}

// ── Core generation logic ────────────────────────────────────────────────────
async function generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints }) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('AI_NOT_CONFIGURED');

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

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini API error ${response.status}`;

    if (response.status === 400 && msg.includes('API_KEY')) {
      throw new Error('INVALID_API_KEY');
    }
    if (response.status === 429) {
      const e = new Error('RATE_LIMIT');
      e.status = 429;
      throw e;
    }
    throw new Error(msg);
  }

  const data = await response.json();
  let content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Strip markdown fences
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let ideas;
  try {
    ideas = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI returned invalid format. Please try again.');
    ideas = JSON.parse(match[0]);
  }

  if (!Array.isArray(ideas)) ideas = [ideas];

  // Normalize
  ideas = ideas.slice(0, 5).map((idea, i) => ({
    name:           idea.name  || idea.title || `Project Idea ${i + 1}`,
    description:    idea.description || '',
    features:       Array.isArray(idea.features) ? idea.features.slice(0, 4) : [],
    techStack:      Array.isArray(idea.techStack || idea.tech_stack)
                      ? (idea.techStack || idea.tech_stack).slice(0, 7)
                      : [],
    difficulty:     idea.difficulty || 'Intermediate',
    innovationScore: Number(idea.innovationScore || idea.noveltyScore || 7),
    estimatedWeeks:  Number(idea.estimatedWeeks || timelineWeeks || 8),
  }));

  return { ideas, model: GEMINI_MODEL };
}

// ── Authenticated endpoint (10 req/hr per user) ──────────────────────────────
export async function generateProjectIdeas(req, res, next) {
  try {
    if (!isGeminiReady()) {
      return res.status(503).json({
        error: 'AI service not configured.',
        setup: 'Add GEMINI_API_KEY to server/.env — free at https://aistudio.google.com/apikey',
      });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`user-${userId}`, 10)) {
      return res.status(429).json({ error: 'Rate limit: 10 AI requests per hour per user.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const result = await generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints });
    console.log(`[ProjectHive] ✅ Generated ${result.ideas.length} ideas for user: ${userId}`);

    return res.json({
      ok: true,
      ideas: result.ideas,
      model: result.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ProjectHive] AI error:', error.message);
    if (error.message === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI not configured. See server/.env' });
    }
    if (error.message === 'INVALID_API_KEY') {
      return res.status(500).json({ error: 'Invalid Gemini API key. Check GEMINI_API_KEY in server/.env' });
    }
    if (error.status === 429 || error.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Gemini rate limit. Wait a moment and try again.' });
    }
    next(error);
  }
}

// ── Public endpoint (5 req/hr per IP — no login) ─────────────────────────────
export async function generateProjectIdeasPublic(req, res, next) {
  try {
    if (!isGeminiReady()) {
      return res.status(503).json({
        error: 'AI service not configured.',
        setup: 'Add GEMINI_API_KEY to server/.env — free at https://aistudio.google.com/apikey',
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkLimit(`ip-${ip}`, 5)) {
      return res.status(429).json({ error: 'Rate limit: 5 free generations/hour.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) return res.status(400).json({ error: 'Domain is required.' });

    const result = await generateIdeas({
      domain,
      skills:        skills || 'General programming',
      teamSize:      teamSize || 3,
      timelineWeeks: timelineWeeks || 8,
      constraints,
    });

    console.log(`[ProjectHive] ✅ Public generation from IP: ${ip}`);

    return res.json({
      ok: true,
      ideas: result.ideas,
      model: result.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ProjectHive] Public AI error:', error.message);
    if (error.status === 429 || error.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'AI rate limit. Please try again in a moment.' });
    }
    next(error);
  }
}
