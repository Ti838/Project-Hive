import { getNvidiaClient } from '../config/nvidia.js';

const MAX_REQUESTS_PER_HOUR = 10;
const userRequestCounts = new Map(); // In production, use Redis

function checkRateLimit(userId) {
  const key = `${userId}-${new Date().getHours()}`;
  const count = userRequestCounts.get(key) || 0;

  if (count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  userRequestCounts.set(key, count + 1);
  return true;
}

export async function generateProjectIdeas(req, res, next) {
  try {
    const userId = req.user.id;
    const { domain, skills, teamSize, timelineWeeks, constraints } = req.body;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Maximum 10 requests per hour.',
      });
    }

    const client = getNvidiaClient();

    const prompt = `You are an AI assistant helping students generate innovative project ideas. Generate exactly 5 project ideas based on the following criteria:

Domain: ${domain}
Required Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
Team Size: ${teamSize} people
Timeline: ${timelineWeeks} weeks
Additional Constraints: ${constraints || 'None'}

For each project idea, provide:
1. Project Name
2. Brief Description (1-2 sentences)
3. Key Features (3-4 bullet points)
4. Tech Stack (5-7 technologies)
5. Difficulty Level (Beginner/Intermediate/Advanced)
6. Innovation Score (1-10)
7. Estimated Timeline (in weeks)

Format your response as a JSON array with objects containing these exact fields: "name", "description", "features" (array), "techStack" (array), "difficulty", "innovationScore", "estimatedWeeks"

Respond ONLY with valid JSON, no additional text.`;

    const response = await client.chat.completions.create({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    let ideas = [];

    try {
      ideas = JSON.parse(content);
      if (!Array.isArray(ideas)) {
        ideas = [ideas];
      }
    } catch (parseError) {
      console.error('[v0] Failed to parse AI response:', parseError);
      // Try to extract JSON from content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    }

    console.log('[v0] Generated', ideas.length, 'project ideas for user:', userId);

    res.json({
      message: 'Project ideas generated successfully',
      ideas: ideas.slice(0, 5), // Ensure only 5
      generatedAt: new Date(),
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
      },
    });
  } catch (error) {
    console.error('[v0] Generate ideas error:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'AI service rate limited. Please try again later.',
      });
    }

    if (error.message.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured properly',
      });
    }

    next(error);
  }
}
