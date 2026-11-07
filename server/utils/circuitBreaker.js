/**
 * ProjectHive Enterprise Circuit Breaker
 * Protects application against cascading failures from external dependencies
 * (AI inference providers, SMTP relays, LiveKit Cloud API).
 *
 * States:
 *   - CLOSED: Normal operation. Requests pass through.
 *   - OPEN: Tripped after failureThreshold. Fast-fails immediately with 503.
 *   - HALF_OPEN: Trial period after resetTimeoutMs. Tests single request.
 */

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5; // failures before opening
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;  // 30s before testing recovery
    this.timeoutMs = options.timeoutMs || 15000;            // 15s per execution timeout

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
  }

  async execute(action, fallbackAction = null) {
    const now = Date.now();

    // Check if OPEN state has expired and should transition to HALF_OPEN
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        const err = new Error(`[CircuitBreaker: ${this.name}] Circuit is OPEN. Service temporarily throttled.`);
        err.status = 503;
        err.isCircuitOpen = true;
        if (fallbackAction) return await fallbackAction(err);
        throw err;
      }
    }

    try {
      // Execute action with timeout
      const result = await Promise.race([
        action(),
        new Promise((_, reject) =>
          setTimeout(() => {
            const timeoutErr = new Error(`[CircuitBreaker: ${this.name}] Action timed out after ${this.timeoutMs}ms`);
            timeoutErr.status = 504;
            reject(timeoutErr);
          }, this.timeoutMs)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallbackAction) return await fallbackAction(err);
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.transitionTo('CLOSED');
      }
    }
  }

  onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker: ${this.name}] Failure #${this.failureCount} (${err.message})`);

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    }
    console.log(`[CircuitBreaker: ${this.name}] State transition: ${oldState} -> ${newState}`);
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastStateChange: new Date(this.lastStateChange).toISOString(),
    };
  }
}

// Global registry of circuit breakers
export const circuitBreakers = {
  ai: new CircuitBreaker('AI_Inference', { failureThreshold: 4, resetTimeoutMs: 20000, timeoutMs: 15000 }),
  smtp: new CircuitBreaker('Email_SMTP', { failureThreshold: 3, resetTimeoutMs: 30000, timeoutMs: 10000 }),
  livekit: new CircuitBreaker('LiveKit_SFU', { failureThreshold: 5, resetTimeoutMs: 15000, timeoutMs: 8000 }),
};

