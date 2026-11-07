import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─── K6 LOAD TESTING PROFILE: PROJECTHIVE ENTERPRISE SCALABILITY ──────────────
// Target: Tests system performance across ramping user tiers
// (100 -> 250 -> 500 -> 1,000 -> 5,000 concurrent virtual users)

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp to 100 VUs
    { duration: '1m',  target: 100 },  // Stay at 100 VUs
    { duration: '30s', target: 250 },  // Ramp to 250 VUs
    { duration: '1m',  target: 250 },  // Stay at 250 VUs
    { duration: '30s', target: 500 },  // Ramp to 500 VUs
    { duration: '1m',  target: 500 },  // Stay at 500 VUs
    { duration: '30s', target: 1000 }, // Ramp to 1,000 VUs (stress threshold)
    { duration: '1m',  target: 1000 }, // Sustained 1,000 VUs
    { duration: '45s', target: 0 },    // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
    http_req_duration: ['p(95)<400'],  // 95% of requests must complete under 400ms
    'http_req_duration{type:cached}': ['p(95)<50'], // Cached routes under 50ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // Journey 1: Infrastructure Health & Liveness Probes
  group('Liveness & Readiness Probes', () => {
    const liveRes = http.get(`${BASE_URL}/api/health/live`);
    check(liveRes, {
      'liveness is 200': (r) => r.status === 200,
      'event loop healthy': (r) => JSON.parse(r.body).status === 'alive',
    });

    const readyRes = http.get(`${BASE_URL}/api/health/ready`);
    check(readyRes, {
      'readiness is 200': (r) => r.status === 200,
      'database ready': (r) => JSON.parse(r.body).database.ok === true,
    });
  });

  sleep(0.5);

  // Journey 2: High-Traffic Cached Stats & Showcase Browsing
  group('Public Showcase & Stats (Cache-Optimized)', () => {
    const statsRes = http.get(`${BASE_URL}/api/stats`, {
      tags: { type: 'cached' },
    });
    check(statsRes, {
      'stats returns 200': (r) => r.status === 200,
      'stats payload valid': (r) => JSON.parse(r.body).ok === true,
    });

    const projectsRes = http.get(`${BASE_URL}/api/projects?limit=20&sortBy=newest`, {
      tags: { type: 'cached' },
    });
    check(projectsRes, {
      'projects returns 200': (r) => r.status === 200,
      'projects list present': (r) => Array.isArray(JSON.parse(r.body).projects),
    });
  });

  sleep(0.8);

  // Journey 3: Squad Matchmaking & Active Teams Discovery
  group('Squad Matchmaking Discovery', () => {
    const teamsRes = http.get(`${BASE_URL}/api/teams?limit=15&status=recruiting`);
    check(teamsRes, {
      'teams discovery returns 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  // Journey 4: TURN & WebRTC Relay Credentials (LiveKit Calling)
  group('WebRTC Session Setup', () => {
    const turnRes = http.get(`${BASE_URL}/api/turn-credentials`);
    check(turnRes, {
      'turn credentials returned': (r) => r.status === 200,
      'iceServers configured': (r) => JSON.parse(r.body).iceServers !== undefined,
    });
  });

  sleep(1.2);
}

