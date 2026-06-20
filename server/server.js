import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeGemini } from './config/gemini.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';
import { supabaseAdmin } from './config/supabase.js';
import {
  setIo,
  registerUserSocket,
  unregisterUserSocket,
  handleJoinRoom,
  handleLeaveRoom,
  handleSendMessage,
  handleTyping,
  handleCallInitiate,
  handleCallAccept,
  handleCallDecline,
  handleCallHangup,
  handleGroupCallInitiate,
} from './services/socket.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[ProjectHive] 🐝 Starting ProjectHive Backend...');
    console.log(`[ProjectHive] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Connect to Supabase
    await connectDB();

    // Initialize Gemini AI (optional)
    try {
      if (process.env.GEMINI_API_KEY) {
        initializeGemini();
      } else {
        console.warn('[ProjectHive] ⚠️  GEMINI_API_KEY not set — AI generator disabled');
      }
    } catch (err) {
      console.warn('[ProjectHive] Gemini init failed (non-fatal):', err.message);
    }

    // HTTP server
    const server = http.createServer(app);

    // Allowed CORS origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5500',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5500',
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_PROD,
    ].filter(Boolean);

    // Socket.IO
    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const ok = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
          if (ok) callback(null, true);
          else callback(new Error('Socket CORS blocked: ' + origin));
        },
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    if (process.env.REDIS_URL) {
      try {
        const pubClient = new Redis(process.env.REDIS_URL);
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[ProjectHive] 🚀 Upstash Redis Socket.IO adapter enabled');
      } catch (err) {
        console.error('[ProjectHive] ⚠️ Failed to initialize Redis Socket.IO adapter:', err.message);
      }
    } else {
      console.log('[ProjectHive] ℹ️ REDIS_URL not set; using local memory Socket.IO adapter');
    }

    setIo(io);
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
      console.log('[ProjectHive] 🔌 User connected:', socket.userId, '| Socket:', socket.id);
      registerUserSocket(socket);

      socket.on('join:room',   (data) => handleJoinRoom(socket, data));
      socket.on('leave:room',  ()     => handleLeaveRoom(socket));
      socket.on('message:send',(data) => handleSendMessage(socket, io, data));
      socket.on('typing:start',(data) => handleTyping(socket, io, { ...data, isTyping: true }));
      socket.on('typing:stop', (data) => handleTyping(socket, io, { ...data, isTyping: false }));
      
      // Video Call Events
      socket.on('call:initiate', (data) => handleCallInitiate(socket, data));
      socket.on('call:accept',   (data) => handleCallAccept(socket, data));
      socket.on('call:decline',  (data) => handleCallDecline(socket, data));
      socket.on('call:hangup',   (data) => handleCallHangup(socket, data));
      socket.on('call:group',    (data) => handleGroupCallInitiate(socket, data));
      socket.on('webrtc:signal', (data) => {
        const { targetId, signal } = data;
        const targetSocket = getUserSocket(targetId);
        if (targetSocket) {
          targetSocket.emit('webrtc:signal', { senderId: socket.userId, signal });
        }
      });

      socket.on('disconnect', (reason) => {
        handleLeaveRoom(socket);
        unregisterUserSocket(socket);
        console.log('[ProjectHive] 🔌 User disconnected:', socket.userId, '| Reason:', reason);
      });
      socket.on('error', (err) => console.error('[ProjectHive] Socket error:', err));
    });

    server.listen(PORT, async () => {
      console.log(`\n[ProjectHive] ✅ Server running on port ${PORT}`);
      console.log(`[ProjectHive] 🌐 API:       http://localhost:${PORT}/api`);
      console.log(`[ProjectHive] 🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`[ProjectHive] 🗄️  Database:  Supabase PostgreSQL`);
      console.log(`[ProjectHive] 📧 Email:     Brevo SMTP\n`);

      // Clean up any stale online statuses from previous server run
      try {
        await supabaseAdmin.from('users').update({ online_status: 'offline' }).neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('[ProjectHive] 🧹 Stale online statuses reset to offline');
      } catch (err) {
        console.error('[ProjectHive] ⚠️ Failed to reset online statuses on startup:', err.message);
      }

      // ─── Keep-alive: self-ping every 14 min to prevent Render cold starts ──
      if (process.env.NODE_ENV === 'production') {
        const BACKEND_URL = process.env.APP_URL_PROD || 'https://projecthive-backend.onrender.com';
        setInterval(async () => {
          try {
            await fetch(`${BACKEND_URL}/api/health`);
            console.log('[ProjectHive] 💓 Keep-alive ping sent');
          } catch (e) {
            // non-fatal
          }
        }, 14 * 60 * 1000); // every 14 minutes
        console.log('[ProjectHive] 💓 Keep-alive enabled (ping every 14 min)');
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n[ProjectHive] Shutting down gracefully...');
      server.close(() => process.exit(0));
    };
    process.on('SIGINT',  shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('[ProjectHive] ❌ Failed to start:', error);
    process.exit(1);
  }
}

startServer();
