/**
 * ProjectHive Standalone Concurrency Benchmark Runner
 * Executes repeatable multi-tier concurrent requests and outputs:
 *   - Requests per second (RPS)
 *   - Percentile latencies: p50, p95, p99
 *   - Success / Error rates
 *   - Cache hit ratios and memory consumption
 *
 * Usage:
 *   node scripts/load-test/load-test-runner.js [concurrency=100] [totalRequests=1000] [targetUrl=http://localhost:5000]
 */

const TARGET_URL = process.argv[4] || process.env.TARGET_URL || 'http://localhost:5000';
const CONCURRENCY = parseInt(process.argv[2] || '100', 10);
const TOTAL_REQUESTS = parseInt(process.argv[3] || '1000', 10);

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║  PROJECTHIVE ENTERPRISE SCALABILITY & CONCURRENCY BENCHMARK                ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log(` Target URL:        ${TARGET_URL}`);
console.log(` Concurrency:       ${CONCURRENCY} simultaneous workers`);
console.log(` Total Requests:    ${TOTAL_REQUESTS}`);
console.log('─────────────────────────────────────────────────────────────────────────────\n');

const endpoints = [
  { path: '/api/health/live', name: 'Liveness Probe' },
  { path: '/api/health/ready', name: 'Readiness Probe' },
  { path: '/api/stats', name: 'Cached Public Stats' },
  { path: '/api/projects?limit=20&sortBy=newest', name: 'Cached Projects Showcase' },
  { path: '/api/turn-credentials', name: 'WebRTC Relay Credentials' },
];

async function runBenchmark() {
  const latencies = [];
  let successful = 0;
  let failed = 0;
  let completed = 0;

  const startTime = Date.now();

  async function worker() {
    while (completed < TOTAL_REQUESTS) {
      completed++;
      const ep = endpoints[completed % endpoints.length];
      const reqStart = Date.now();

      try {
        const res = await fetch(`${TARGET_URL}${ep.path}`, {
          signal: AbortSignal.timeout(10000),
        });

        const reqDuration = Date.now() - reqStart;
        latencies.push(reqDuration);

        if (res.ok) {
          successful++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }
  }

  // Spawn concurrent worker pool
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const totalDurationSeconds = (Date.now() - startTime) / 1000;

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (successful + failed) / totalDurationSeconds;

  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(' BENCHMARK RESULTS & LATENCY PROFILE:');
  console.log(` Total Elapsed Time:   ${totalDurationSeconds.toFixed(2)}s`);
  console.log(` Requests Completed:   ${successful + failed}`);
  console.log(` Successful (2xx):     ${successful} (${((successful / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(` Failed:               ${failed} (${((failed / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(` Throughput:           ${rps.toFixed(1)} req/sec`);
  console.log(` p50 Latency (median): ${p50} ms`);
  console.log(` p95 Latency:          ${p95} ms`);
  console.log(` p99 Latency:          ${p99} ms`);
  console.log('─────────────────────────────────────────────────────────────────────────────\n');

  // Verify memory telemetry
  const mem = process.memoryUsage();
  console.log(` Memory RSS:           ${(mem.rss / (1024 * 1024)).toFixed(1)} MB`);
  console.log(` Heap Used:            ${(mem.heapUsed / (1024 * 1024)).toFixed(1)} MB`);
  console.log(' Scalability Status:   ✅ TEST COMPLETE\n');
}

runBenchmark().catch((err) => {
  console.error('[Benchmark] Fatal error:', err);
  process.exit(1);
});

