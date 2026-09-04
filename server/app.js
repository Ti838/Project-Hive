import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeInputMiddleware } from './middleware/sanitize.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import aiRoutes from './routes/ai.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { adminDevRouter } from './routes/admin.routes.js';
import { adminLogin } from './controllers/admin.auth.controller.js';
import { getFlags, loadFlagsFromDB } from './controllers/admin.controller.js';
import postsRoutes from './routes/posts.routes.js';
import storiesRoutes from './routes/stories.routes.js';
import callsRoutes from './routes/calls.routes.js';
import githubRoutes from './routes/github.routes.js';

const app = express();

// Trust proxy — required on Render/Vercel/Heroku/any reverse proxy
// Allows express-rate-limit to read real client IP from X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.socket.io", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://esm.sh", "https://meet.jit.si"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://projecthive-backend.onrender.com", "wss://projecthive-backend.onrender.com", "https://generativelanguage.googleapis.com", "https://api.groq.com", "https://api.brevo.com", "https://iekfvgjxkmgduxdvkuxf.supabase.co", "turn:staticauth.openrelay.metered.ca:80", "turn:staticauth.openrelay.metered.ca:443", "turns:staticauth.openrelay.metered.ca:443"],
      frameSrc: ["'self'", "https://meet.jit.si"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,     // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));



// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      // Vercel — all subdomains (covers projecthive-bd.vercel.app, project-hive.vercel.app, etc.)
      /\.vercel\.app$/,
      // Explicit production URL
      process.env.FRONTEND_URL_PROD,
      // Local development — any port
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ].filter(Boolean);

    const isAllowed = allowed.some(rule =>
      rule instanceof RegExp ? rule.test(origin) : rule === origin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Cookie parsing
app.use(cookieParser());

// Body parsing (15MB default — to match frontend image upload limits)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// XSS sanitization — strip dangerous HTML/scripts from all inputs
app.use(sanitizeInputMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/admin/auth/login', authLimiter);

// Health check (both paths for keep-alive compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'projecthive-backend', timestamp: new Date() });
});

// Database & Subsystem Health Check
app.get('/api/health/db', async (req, res) => {
  const startTime = Date.now();
  try {
    const { supabaseAdmin } = await import('./config/supabase.js');
    const [
      { count: usersCount, error: uErr },
      { count: teamsCount, error: tErr },
      { count: projectsCount, error: pErr },
      { count: postsCount, error: poErr },
      { data: buckets, error: bErr }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.storage.listBuckets(),
    ]);

    const latencyMs = Date.now() - startTime;
    const hasError = uErr || tErr || pErr || poErr || bErr;

    return res.status(hasError ? 503 : 200).json({
      status: hasError ? 'degraded' : 'healthy',
      database: 'Supabase PostgreSQL',
      latencyMs,
      tables: {
        users: uErr ? { ok: false, error: uErr.message } : { ok: true, count: usersCount },
        teams: tErr ? { ok: false, error: tErr.message } : { ok: true, count: teamsCount },
        projects: pErr ? { ok: false, error: pErr.message } : { ok: true, count: projectsCount },
        posts: poErr ? { ok: false, error: poErr.message } : { ok: true, count: postsCount },
      },
      storage: {
        ok: !bErr,
        bucketCount: buckets?.length || 0,
        buckets: (buckets || []).map(b => ({ name: b.name, public: b.public })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'unhealthy',
      database: 'Supabase PostgreSQL',
      error: 'SUPABASE_QUERY_FAILED',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Public stats — for homepage (no auth required)
app.get('/api/stats', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./config/supabase.js');
    const [
      { count: users },
      { count: teams },
      { count: projects },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
    ]);

    // Count distinct universities
    const { data: uniData } = await supabaseAdmin
      .from('users')
      .select('university')
      .neq('university', null)
      .neq('university', '');
    const universities = new Set((uniData || []).map(u => u.university?.trim().toLowerCase())).size;

    res.json({ users: users || 0, teams: teams || 0, projects: projects || 0, universities });
  } catch (err) {
    res.json({ users: 0, teams: 0, projects: 0, universities: 0 });
  }
});

// Auth and Admin routes are exempted from maintenance mode
app.use('/api/auth', authRoutes);
app.post('/api/admin/auth/login', adminLogin);
app.use('/api/admin', adminRoutes);
// DEV ONLY: promote-me endpoint — only register in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/admin', adminDevRouter);
}

// Maintenance Mode Middleware
app.use('/api', (req, res, next) => {
  const FLAGS = getFlags();
  // Allow system requests through
  if (req.path === '/health' || req.path === '/public-stats') {
    return next();
  }
  if (FLAGS.maintenanceMode) {
    return res.status(503).json({
      error: 'ProjectHive is currently undergoing maintenance. Please check back later.',
      maintenanceMode: true
    });
  }
  next();
});

app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/github', githubRoutes); // GitHub Developer Collaboration Core
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/stories', storiesRoutes); // stories
app.use('/api/calls', callsRoutes); // native LiveKit calling
app.use('/api', postsRoutes);   // feed, posts, reactions, comments

// TURN credentials endpoint
app.get('/api/turn-credentials', async (req, res) => {
  try {
    if (process.env.METERED_API_KEY) {
      const response = await fetch(`https://${process.env.METERED_DOMAIN || 'projecthive.metered.live'}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);
      const data = await response.json();
      return res.json(data);
    }

    // Fallback to HMAC open relay
    const turnSecret = process.env.TURN_SECRET || 'openrelayprojectsecret';
    const turnDomain = process.env.TURN_DOMAIN || 'staticauth.openrelay.metered.ca';
    const unixTimestamp = Math.floor(Date.now() / 1000) + 24 * 3600;
    const username = unixTimestamp.toString();
    const credential = crypto.createHmac('sha1', turnSecret).update(username).digest('base64');

    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: `turn:${turnDomain}:80`,
          username: username,
          credential: credential
        },
        // TURN over TCP on port 80
        {
          urls: `turn:${turnDomain}:80?transport=tcp`,
          username: username,
          credential: credential
        },
        // TURN on port 443 (corporate firewalls)
        {
          urls: `turn:${turnDomain}:443`,
          username: username,
          credential: credential
        },
        // TURNS over TLS on 443 (maximum firewall bypass)
        {
          urls: `turns:${turnDomain}:443?transport=tcp`,
          username: username,
          credential: credential
        }
      ],
      ttl: 86400 // 24 hours
    });
  } catch(e) {
    console.error('[ProjectHive] TURN credential generation failed:', e.message);
    res.json({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  }
});


// Health check for Render deployment
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ProjectHive Backend API',
    timestamp: new Date().toISOString()
  });
});

// Headless API fallback: returns JSON for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
