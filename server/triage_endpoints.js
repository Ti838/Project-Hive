import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { supabaseAdmin } from './config/supabase.js';
import { initializeGemini } from './config/gemini.js';

async function triage() {
  console.log('====================================================');
  console.log('🔍 PROJECT HIVE EMERGENCY RUNTIME TRIAGE TEST');
  console.log('====================================================\n');

  initializeGemini();

  // Start internal server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5001, resolve));
  const BASE = 'http://localhost:5001/api';

  console.log('1. Testing Public Endpoints:');
  try {
    const healthRes = await fetch(`${BASE}/health`);
    console.log('   /api/health -> Status:', healthRes.status, await healthRes.json());

    const statsRes = await fetch(`${BASE}/stats`);
    console.log('   /api/stats -> Status:', statsRes.status, await statsRes.json());
  } catch (e) {
    console.error('   ❌ Public endpoints failed:', e.message);
  }

  console.log('\n2. Testing Authentication Handshake:');
  let token = '';
  let testUser = null;
  try {
    // Find an existing user or admin
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (error || !users || users.length === 0) {
      console.error('   ❌ No users found in Supabase database:', error);
    } else {
      testUser = users[0];
      console.log(`   Found DB user: ${testUser.email} (role: ${testUser.role})`);
    }

    // Test Admin Login with .env credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@projecthive.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ProjectHive@Admin2026!';

    const adminLoginRes = await fetch(`${BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('   /api/admin/auth/login -> Status:', adminLoginRes.status, {
      ok: adminLoginData.ok,
      hasToken: !!(adminLoginData.token || adminLoginData.accessToken),
      user: adminLoginData.user?.email,
      role: adminLoginData.user?.role,
    });

    token = adminLoginData.accessToken || adminLoginData.token;
  } catch (e) {
    console.error('   ❌ Auth handshake failed:', e.message);
  }

  // Also create a student token for student endpoints if testUser exists
  let studentToken = token;
  if (testUser && process.env.JWT_SECRET) {
    studentToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  if (!token) {
    console.error('\n❌ ABORTING PROTECTED ENDPOINTS: No token obtained.');
    server.close();
    process.exit(1);
  }

  console.log('\n3. Testing Protected Student & System Endpoints with Bearer Token:');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

    const endpoints = [
    { name: '/api/users/me', path: '/users/me', expectedField: 'id', useToken: studentToken },
    { name: '/api/posts', path: '/posts', expectedField: 'posts', useToken: studentToken },
    { name: '/api/teams', path: '/teams', expectedField: 'teams', useToken: studentToken },
    { name: '/api/teams/my-teams', path: '/teams/my-teams', expectedField: 'teams', useToken: studentToken },
    { name: '/api/projects', path: '/projects', expectedField: 'projects', useToken: studentToken },
    { name: '/api/users/people', path: '/users/people', expectedField: 'users', useToken: studentToken },
    { name: '/api/notifications', path: '/notifications', expectedField: 'notifications', useToken: studentToken },
    { name: '/api/friends', path: '/friends', expectedField: 'friends', useToken: studentToken },
    { name: '/api/posts/saved', path: '/posts/saved', expectedField: 'posts', useToken: studentToken },
    { name: '/api/admin/stats', path: '/admin/stats', expectedField: 'users', useToken: token },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep.path}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ep.useToken || token}`,
        }
      });
      const data = await res.json();
      const hasExpected = data && (data[ep.expectedField] !== undefined || data.data !== undefined || data.id !== undefined);
      console.log(`   ${ep.name.padEnd(22)} -> Status: ${res.status} | OK: ${data.ok ?? res.ok} | Has '${ep.expectedField}': ${hasExpected} | Payload Keys: [${Object.keys(data).slice(0, 5).join(', ')}]`);
      if (res.status >= 400) {
        console.log(`      ⚠️ Error details:`, data);
      }
    } catch (e) {
      console.log(`   ❌ ${ep.name} crashed: ${e.message}`);
    }
  }

  console.log('\n4. Testing Hive AI Central Execution Gateway (/api/ai/execute):');
  try {
    const aiRes = await fetch(`${BASE}/ai/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken || token}`,
      },
      body: JSON.stringify({
        capability: 'copilot_chat',
        prompt: 'Hello Hive AI! Confirm you are operational in 10 words.',
      }),
    });
    const aiData = await aiRes.json();
    console.log(`   /api/ai/execute       -> Status: ${aiRes.status} | OK: ${aiData.ok} | Provider: ${aiData.provider} | Model: ${aiData.model}`);
    console.log(`   Sample Output: "${(aiData.output || '').slice(0, 100)}..."`);
  } catch (e) {
    console.log(`   ❌ AI execute failed: ${e.message}`);
  }

  server.close();
  console.log('\n====================================================');
  console.log('✅ TRIAGE DIAGNOSTIC RUN COMPLETE');
  console.log('====================================================');
}

triage();

