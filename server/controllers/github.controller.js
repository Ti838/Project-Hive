import { supabaseAdmin } from '../config/supabase.js';
import * as githubService from '../services/github.service.js';
import { callAI } from './ai.controller.js';
import { getIo } from '../services/socket.service.js';

/**
 * GET /api/github/status
 * Get connection status of current user's GitHub integration
 */
export async function getGitHubStatus(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('github, github_token, id')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const isConnected = !!(user?.github || user?.github_token);
    let profile = null;

    if (isConnected && user?.github) {
      try {
        const username = user.github.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
        profile = await githubService.getUserProfile(username, user?.github_token);
      } catch (err) {
        console.warn('[getGitHubStatus] Failed to fetch external profile:', err.message);
      }
    }

    res.json({
      connected: isConnected,
      username: user?.github ? user.github.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '') : null,
      profile,
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/github/connect
 * Connect or update GitHub username / personal access token
 */
export async function connectGitHub(req, res, next) {
  try {
    const userId = req.user?.id;
    const { username, token } = req.body;

    if (!username && !token) {
      return res.status(400).json({ error: 'Username or Access Token is required' });
    }

    const cleanUsername = username ? username.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').trim() : '';

    // Validate connection by fetching profile
    let validatedProfile = null;
    try {
      validatedProfile = await githubService.getUserProfile(cleanUsername || 'octocat', token || null);
    } catch (err) {
      return res.status(400).json({ error: `GitHub validation failed: ${err.message}` });
    }

    const updates = {};
    if (cleanUsername) updates.github = cleanUsername;
    if (token) updates.github_token = token;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, github')
      .single();

    if (error) throw error;

    res.json({
      message: 'GitHub connected successfully',
      connected: true,
      username: cleanUsername,
      profile: validatedProfile,
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/github/disconnect
 * Disconnect GitHub from user account
 */
export async function disconnectGitHub(req, res, next) {
  try {
    const userId = req.user?.id;
    const { error } = await supabaseAdmin
      .from('users')
      .update({ github: null, github_token: null })
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'GitHub disconnected successfully', connected: false });
  } catch (err) { next(err); }
}

/**
 * GET /api/github/user/:username
 * Public profile data from GitHub
 */
export async function getUserProfile(req, res, next) {
  try {
    const { username } = req.params;
    const profile = await githubService.getUserProfile(username);
    res.json(profile);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo
 */
export async function getRepoOverview(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const details = await githubService.getRepoDetails(owner, repo);
    res.json(details);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/readme
 */
export async function getRepoReadme(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const readme = await githubService.getRepoReadme(owner, repo);
    res.json(readme || { content: '# No README found' });
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/tree
 */
export async function getRepoTree(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch } = req.query;
    const tree = await githubService.getRepoTree(owner, repo, branch);
    res.json(tree);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/file
 */
export async function getRepoFile(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { path, branch } = req.query;
    if (!path) return res.status(400).json({ error: 'File path parameter is required' });
    const file = await githubService.getRepoFileContent(owner, repo, path, branch);
    res.json(file);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/commits
 */
export async function getRepoCommits(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch, limit = 30 } = req.query;
    const commits = await githubService.getRepoCommits(owner, repo, branch, parseInt(limit));
    res.json(commits);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/branches
 */
export async function getRepoBranches(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const branches = await githubService.getRepoBranches(owner, repo);
    res.json(branches);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/issues
 */
export async function getRepoIssues(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { state = 'all', limit = 30 } = req.query;
    const issues = await githubService.getRepoIssues(owner, repo, state, parseInt(limit));
    res.json(issues);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/pulls
 */
export async function getRepoPulls(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { state = 'all', limit = 30 } = req.query;
    const pulls = await githubService.getRepoPulls(owner, repo, state, parseInt(limit));
    res.json(pulls);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/pulls/:pullNumber
 */
export async function getPullRequestDetail(req, res, next) {
  try {
    const { owner, repo, pullNumber } = req.params;
    const pr = await githubService.getPullRequestDetail(owner, repo, parseInt(pullNumber));
    res.json(pr);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/actions
 */
export async function getRepoActions(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { limit = 15 } = req.query;
    const actions = await githubService.getRepoActions(owner, repo, parseInt(limit));
    res.json(actions);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/releases
 */
export async function getRepoReleases(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { limit = 10 } = req.query;
    const releases = await githubService.getRepoReleases(owner, repo, parseInt(limit));
    res.json(releases);
  } catch (err) { next(err); }
}

/**
 * GET /api/github/repo/:owner/:repo/health
 */
export async function getProjectHealth(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const health = await githubService.calculateProjectHealth(owner, repo);
    res.json(health);
  } catch (err) { next(err); }
}

/**
 * POST /api/github/ai-review
 * Perform AI PR / Code Review using multi-model cascade
 */
export async function performAiCodeReview(req, res, next) {
  try {
    const { title, description, patch, filename, type = 'pr' } = req.body;

    const systemPrompt = `You are Hive AI — ProjectHive's expert developer intelligence agent.
Perform an in-depth, production-grade review of the provided pull request / code changes.

Analyze for:
1. Executive Summary & Core Changes
2. Risk Level: "Low", "Medium", or "High" with exact justification
3. Potential Bugs, Edge Cases & Race Conditions
4. Security & Vulnerability Concerns (OWASP, SQLi, XSS, Secret Leaks)
5. Performance Bottlenecks & Optimization Opportunities
6. Testing Gaps & Recommended Test Cases
7. Clear Suggested Code Refactorings

Format your output in clean, structured Markdown with clear section headers, concise bullet points, and code blocks where applicable.`;

    const userPrompt = `Title: ${title || 'Code Change'}
Description: ${description || 'No description provided'}
File: ${filename || 'Multiple Files'}

DIFF / CODE PATCH:
\`\`\`diff
${(patch || '').substring(0, 10000)}
\`\`\`

Provide your developer review now.`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await callAI(fullPrompt);
    res.json({
      review: result.text,
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/github/webhook
 * GitHub Webhook listener with HMAC verification and realtime Socket.IO dispatch
 */
export async function handleGitHubWebhook(req, res, next) {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'projecthive_dev_secret';

    // Verify signature if secret configured
    if (webhookSecret && signature) {
      const isValid = githubService.verifyWebhookSignature(req.body, signature, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = req.body;
    const repoFullName = payload.repository?.full_name;
    console.log(`[GitHub Webhook] Received ${event} for ${repoFullName}`);

    // Broadcast event via Socket.IO to connected project rooms
    const io = getIo();
    if (io && repoFullName) {
      io.emit('github:event', {
        event,
        repo: repoFullName,
        sender: payload.sender?.login,
        action: payload.action,
        timestamp: new Date().toISOString(),
        summary: event === 'push'
          ? `${payload.pusher?.name} pushed ${payload.commits?.length || 1} commit(s) to ${payload.ref}`
          : event === 'pull_request'
          ? `PR #${payload.pull_request?.number} "${payload.pull_request?.title}" ${payload.action}`
          : event === 'issues'
          ? `Issue #${payload.issue?.number} "${payload.issue?.title}" ${payload.action}`
          : `${event} event received`,
      });
    }

    res.json({ received: true, event });
  } catch (err) { next(err); }
}
