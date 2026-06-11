import { getNvidiaClient } from '../config/nvidia.js';

const MAX_REQUESTS_PER_HOUR = 10;
const userRequestCounts = new Map();

function checkRateLimit(userId) {
  const key = `${userId}-${new Date().getHours()}`;
  const count = userRequestCounts.get(key) || 0;
  if (count >= MAX_REQUESTS_PER_HOUR) return false;
  userRequestCounts.set(key, count + 1);
  return true;
}

// ── Shared idea generation logic ────────────────────────────────────────────
async function runGeneration({ domain, skills, teamSize, timelineWeeks, constraints }) {
  const client = getNvidiaClient();

  const skillsList = Array.isArray(skills)
    ? skills.join(', ')
    : (skills || 'General programming');

  const prompt = `You are an expert mentor helping university students generate innovative project ideas.

Generate exactly 5 unique, realistic, and implementable project ideas based on:
- Domain: ${domain}
- Team Skills: ${skillsList}
- Team Size: ${teamSize} people
- Timeline: ${timelineWeeks} weeks
- Constraints: ${constraints || 'None'}

Return ONLY a valid JSON array (no markdown, no extra text) with exactly 5 objects, each having:
{
  "name": "Project Name",
  "description": "2-3 sentence description of what it does and why it matters",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "techStack": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "innovationScore": <number 1-10>,
  "estimatedWeeks": <number>
}`;

  const response = await client.chat.completions.create({
    model: 'meta/llama-3.1-405b-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    top_p: 0.9,
    max_tokens: 2500,
  });

  const content = response.choices[0].message.content.trim();

  let ideas = [];
  try {
    // Try direct parse
    ideas = JSON.parse(content);
  } catch {
    // Strip markdown code fences if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\[[\s\S]*\])/);
    if (jsonMatch) {
      ideas = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      throw new Error('AI returned non-JSON response. Please try again.');
    }
  }

  if (!Array.isArray(ideas)) ideas = [ideas];

  return {
    ideas: ideas.slice(0, 5),
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    },
  };
}

// ── Authenticated endpoint (with rate limiting per user) ─────────────────────
export async function generateProjectIdeas(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId || 'anon';

    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Maximum 10 AI requests per hour.',
      });
    }

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required.' });
    }

    const result = await runGeneration({ domain, skills, teamSize, timelineWeeks, constraints });

    console.log(`[ProjectHive] Generated ${result.ideas.length} ideas for user: ${userId}`);

    return res.json({
      ok: true,
      message: 'Project ideas generated successfully',
      ideas: result.ideas,
      generatedAt: new Date().toISOString(),
      usage: result.usage,
    });
  } catch (error) {
    console.error('[ProjectHive] Generate ideas error:', error.message);

    if (error.status === 401 || (error.message && error.message.includes('API key'))) {
      return res.status(500).json({ error: 'AI service not configured. Add NVIDIA_NIM_API_KEY to server/.env' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'NVIDIA AI rate limit hit. Please wait a moment.' });
    }

    next(error);
  }
}

// ── Public endpoint (no auth needed, rate limited by IP) ─────────────────────
const ipCounts = new Map();

export async function generateProjectIdeasPublic(req, res, next) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${ip}-${new Date().getHours()}`;
    const count = ipCounts.get(key) || 0;

    if (count >= 5) {
      return res.status(429).json({
        error: 'Rate limit: 5 free generations per hour. Sign up for more!',
      });
    }
    ipCounts.set(key, count + 1);

    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required.' });
    }

    const result = await runGeneration({
      domain,
      skills: skills || 'General programming',
      teamSize: teamSize || 3,
      timelineWeeks: timelineWeeks || 8,
      constraints,
    });

    console.log(`[ProjectHive] Public generation from IP: ${ip}`);

    return res.json({
      ok: true,
      ideas: result.ideas,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ProjectHive] Public generate error:', error.message);

    if (error.status === 401 || (error.message && error.message.includes('API key'))) {
      return res.status(500).json({ error: 'AI service not configured. See README for setup.' });
    }

    next(error);
  }
}
