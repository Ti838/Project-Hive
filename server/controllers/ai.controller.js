// ── AI Controller — Groq (Free LLaMA 3.3 70B) ──────────────────────────────
import { getGroqClient, isGroqReady } from '../config/nvidia.js';

const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Best free model on Groq

// In-memory rate limiter (per user/IP per hour)
const rateLimitMap = new Map();

function checkLimit(key, max) {
  const hourKey = `${key}-${new Date().getHours()}`;
  const count = rateLimitMap.get(hourKey) || 0;
  if (count >= max) return false;
  rateLimitMap.set(hourKey, count + 1);
  return true;
}

// ── Core generation logic ────────────────────────────────────────────────────
async function generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints }) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const skillsList = Array.isArray(skills)
    ? skills.filter(Boolean).join(', ')
    : (skills || 'General programming');

  const systemPrompt = `You are an expert university project advisor. 
Generate creative, realistic, and implementable project ideas for students.
Always respond with ONLY a valid JSON array — no markdown, no explanation, no extra text.`;

  const userPrompt = `Generate exactly 5 unique and innovative university project ideas for:
- Domain: ${domain}
- Team Skills: ${skillsList}
- Team Size: ${teamSize || 3} people
- Timeline: ${timelineWeeks || 8} weeks
- Constraints: ${constraints || 'None'}

Return a JSON array of exactly 5 objects. Each object must have these exact keys:
{
  "name": "Short catchy project name",
  "description": "2-3 sentences explaining what it does and why it matters for students/society",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "techStack": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "difficulty": "Beginner" or "Intermediate" or "Advanced",
  "innovationScore": <integer 1-10>,
  "estimatedWeeks": <integer>
}

Only output the raw JSON array. No markdown. No \`\`\`json blocks.`;

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 3000,
    top_p: 0.9,
  });

  let content = completion.choices[0].message.content.trim();

  // Strip markdown fences if model adds them
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let ideas;
  try {
    ideas = JSON.parse(content);
  } catch {
    // Try to extract JSON array from content
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI returned invalid format. Please try again.');
    ideas = JSON.parse(match[0]);
  }

  if (!Array.isArray(ideas)) ideas = [ideas];

  // Normalize fields
  ideas = ideas.slice(0, 5).map((idea, i) => ({
    name: idea.name || idea.title || `Project Idea ${i + 1}`,
    description: idea.description || '',
    features: Array.isArray(idea.features) ? idea.features.slice(0, 4) : [],
    techStack: Array.isArray(idea.techStack || idea.tech_stack) 
      ? (idea.techStack || idea.tech_stack).slice(0, 7) 
      : [],
    difficulty: idea.difficulty || 'Intermediate',
    innovationScore: Number(idea.innovationScore || idea.noveltyScore || 7),
    estimatedWeeks: Number(idea.estimatedWeeks || timelineWeeks || 8),
  }));

  return {
    ideas,
    model: GROQ_MODEL,
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    },
  };
}

// ── Authenticated endpoint (10 req/hr per user) ──────────────────────────────
export async function generateProjectIdeas(req, res, next) {
  try {
    if (!isGroqReady()) {
      return res.status(503).json({
        error: 'AI service not configured.',
        setup: 'Add GROQ_API_KEY to server/.env — get free key at https://console.groq.com',
      });
    }

    const userId = req.user?.id || req.user?.userId || 'anon';
    if (!checkLimit(`user-${userId}`, 10)) {
      return res.status(429).json({ error: 'Rate limit: 10 AI requests per hour per user.' });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) {
      return res.status(400).json({ error: 'Domain is required.' });
    }

    const result = await generateIdeas({ domain, skills, teamSize, timelineWeeks, constraints });
    console.log(`[ProjectHive] ✅ Generated ${result.ideas.length} ideas for user: ${userId}`);

    return res.json({
      ok: true,
      ideas: result.ideas,
      model: result.model,
      generatedAt: new Date().toISOString(),
      usage: result.usage,
    });
  } catch (error) {
    console.error('[ProjectHive] AI error:', error.message);
    if (error.message === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI not configured. See server/.env' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Groq rate limit hit. Wait a moment and try again.' });
    }
    next(error);
  }
}

// ── Public endpoint (5 req/hr per IP — no login needed) ─────────────────────
export async function generateProjectIdeasPublic(req, res, next) {
  try {
    if (!isGroqReady()) {
      return res.status(503).json({
        error: 'AI service not configured.',
        setup: 'Add GROQ_API_KEY to server/.env — free key at https://console.groq.com',
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkLimit(`ip-${ip}`, 5)) {
      return res.status(429).json({
        error: 'Rate limit: 5 free generations/hour. Sign up for more!',
      });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;
    if (!domain?.trim()) {
      return res.status(400).json({ error: 'Domain is required.' });
    }

    const result = await generateIdeas({
      domain,
      skills: skills || 'General programming',
      teamSize: teamSize || 3,
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
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit. Please try again in a moment.' });
    }
    next(error);
  }
}
