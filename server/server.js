import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeGemini } from './config/nvidia.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';
import {
  registerUserSocket,
  unregisterUserSocket,
  handleJoinRoom,
  handleLeaveRoom,
  handleSendMessage,
  handleTyping,
} from './services/socket.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[ProjectHive] Starting ProjectHive Backend Server...');

    // Connect to MongoDB
    await connectDB();

    // Redis is optional — skip if REDIS_URL not set
    let redisClient = null;
    if (process.env.REDIS_URL) {
      try {
        const { initializeRedis } = await import('./config/redis.js');
        redisClient = initializeRedis();
      } catch (error) {
        console.warn('[v0] Redis initialization optional, continuing without it');
      }
    }

    // Initialize Google Gemini AI (free — https://aistudio.google.com/apikey)
    try {
      if (process.env.GEMINI_API_KEY) {
        initializeGemini();
      } else {
        console.warn('[ProjectHive] ⚠️  GEMINI_API_KEY not set — AI idea generator disabled.');
        console.warn('[ProjectHive]    Get free key at: https://aistudio.google.com/apikey');
      }
    } catch (error) {
      console.warn('[ProjectHive] Gemini init failed:', error.message);
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO with permissive CORS for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_PROD,
    ].filter(Boolean);

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Apply Socket.IO middleware
    io.use(socketAuthMiddleware);

    // Redis adapter for scaling (optional)
    if (redisClient) {
      try {
        const { createAdapter } = await import('@socket.io/redis-adapter');
        const pubClient = redisClient.duplicate();
        await pubClient.connect();
        io.adapter(createAdapter(redisClient, pubClient));
        console.log('[v0] Socket.IO Redis adapter configured');
      } catch (error) {
        console.warn('[v0] Redis adapter setup failed, using in-memory adapter');
      }
    }

    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('[v0] User connected:', socket.userId, '| Socket:', socket.id);
      registerUserSocket(socket);

      // Room management
      socket.on('join:room', (data) => {
        handleJoinRoom(socket, data);
      });

      socket.on('leave:room', () => {
        handleLeaveRoom(socket);
      });

      // Messaging
      socket.on('message:send', (data) => {
        handleSendMessage(socket, io, data);
      });

      // Typing indicators
      socket.on('typing:start', (data) => {
        handleTyping(socket, io, { ...data, isTyping: true });
      });

      socket.on('typing:stop', (data) => {
        handleTyping(socket, io, { ...data, isTyping: false });
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        handleLeaveRoom(socket);
        unregisterUserSocket(socket.userId);
        console.log('[v0] User disconnected:', socket.userId, '| Reason:', reason);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('[v0] Socket error:', error);
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`[v0] ✅ ProjectHive Backend running on port ${PORT}`);
      console.log(`[v0] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[v0] API: http://localhost:${PORT}/api`);
      console.log(`[v0] Socket.IO: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[v0] Shutting down gracefully...');
      server.close(() => {
        console.log('[v0] Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('[v0] SIGTERM received, shutting down...');
      server.close(() => {
        console.log('[v0] Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[v0] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
