/**
 * ProjectHive Enterprise Shutdown & Health Telemetry Manager
 * Handles:
 *   - Clean connection draining (HTTP + WebSockets)
 *   - Background queue draining
 *   - External resource disconnection (Redis, DB)
 *   - Event loop lag monitoring & memory tracking
 */
import { queueService } from '../services/queue.service.js';
import { cacheService } from '../services/cache.service.js';
import { circuitBreakers } from './circuitBreaker.js';

class ShutdownManager {
  constructor() {
    this.isShuttingDown = false;
    this.httpServer = null;
    this.ioServer = null;
    this.eventLoopLagMs = 0;

    this.startEventLoopMonitor();
  }

  registerServers(httpServer, ioServer) {
    this.httpServer = httpServer;
    this.ioServer = ioServer;
  }

  startEventLoopMonitor() {
    // Measure event loop lag every 2 seconds
    let lastTime = Date.now();
    setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      this.eventLoopLagMs = Math.max(0, delta - 2000);
      lastTime = now;
    }, 2000).unref();
  }

  getLiveness() {
    const memory = process.memoryUsage();
    return {
      status: this.isShuttingDown ? 'shutting_down' : 'alive',
      uptimeSeconds: Math.floor(process.uptime()),
      eventLoopLagMs: this.eventLoopLagMs,
      memory: {
        rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
        heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(1),
      },
      timestamp: new Date().toISOString(),
    };
  }

  getReadiness(dbStatus = { ok: true, latencyMs: 0 }) {
    const isHealthy = !this.isShuttingDown && dbStatus.ok && this.eventLoopLagMs < 2000;
    return {
      status: isHealthy ? 'ready' : 'not_ready',
      database: dbStatus,
      cache: cacheService.getStats(),
      queue: queueService.getStats(),
      circuitBreakers: {
        ai: circuitBreakers.ai.getStatus(),
        smtp: circuitBreakers.smtp.getStatus(),
        livekit: circuitBreakers.livekit.getStatus(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  initiateShutdown(signal = 'SIGTERM') {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`\n[ProjectHive Shutdown] 🛑 Received ${signal}. Commencing graceful shutdown...`);

    // Hard fallback timeout (10 seconds)
    const forceExitTimer = setTimeout(() => {
      console.error('[ProjectHive Shutdown] ⚠️ Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    (async () => {
      try {
        // 1. Notify connected Socket.IO clients and close WebSockets
        if (this.ioServer) {
          console.log('[ProjectHive Shutdown] 🔌 Notifying and closing WebSockets...');
          this.ioServer.emit('server:shutdown', { message: 'Server is updating. Reconnecting shortly.' });
          this.ioServer.close();
        }

        // 2. Stop accepting new HTTP requests and close idle keep-alive connections
        if (this.httpServer) {
          console.log('[ProjectHive Shutdown] 🌐 Closing HTTP server and idle connections...');
          if (typeof this.httpServer.closeIdleConnections === 'function') {
            this.httpServer.closeIdleConnections();
          }
          await new Promise((resolve) => this.httpServer.close(resolve));
        }

        // 3. Drain active background queue jobs (up to 8s)
        await queueService.drain(8000);

        // 4. Disconnect cache & Redis
        await cacheService.disconnect();

        console.log('[ProjectHive Shutdown] ✅ Clean shutdown complete. Exiting process.');
        clearTimeout(forceExitTimer);
        process.exit(0);
      } catch (err) {
        console.error('[ProjectHive Shutdown] ❌ Error during graceful shutdown:', err);
        clearTimeout(forceExitTimer);
        process.exit(1);
      }
    })();
  }
}

export const shutdownManager = new ShutdownManager();
export default shutdownManager;

