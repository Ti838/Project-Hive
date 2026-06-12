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

const app = express();

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
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD,
  ].filter(Boolean),
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/friends', friendsRoutes);
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
