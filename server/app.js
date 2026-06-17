import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import { errorHandler } from './middleware/errorHandler.js';

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
import postsRoutes from './routes/posts.routes.js';

const app = express();

// Trust proxy — required on Render/Vercel/Heroku/any reverse proxy
// Allows express-rate-limit to read real client IP from X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow CDN scripts (Tailwind, fonts)
  crossOriginEmbedderPolicy: false,
}));

// Serve static frontend files from /public
const publicDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDir));

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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check (both paths for keep-alive compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'projecthive-backend', timestamp: new Date() });
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

// API Routes
app.use('/api/auth', authRoutes);
app.post('/api/admin/auth/login', adminLogin);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api', postsRoutes);   // feed, posts, reactions, comments

// Admin routes (require auth + admin role)
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminDevRouter); // dev only: /api/admin/promote-me


// 404 handler for API routes only — HTML pages are served by express.static above
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // For any other path, serve index.html (handles direct URL access)
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
