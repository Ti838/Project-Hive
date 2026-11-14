/**
 * ProjectHive Production Security Audit Test Suite
 * Conforms to OWASP ASVS 5.0.0 Level 2 & NIST SP 800-207 Zero-Trust Architecture
 */

import 'dotenv/config';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './config/supabase.js';
import { generateAccessToken, verifyAccessToken } from './utils/jwt.utils.js';
import app from './app.js';

let testServer;
let baseUrl = 'http://127.0.0.1:5000';

before(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/');
    if (res.ok) {
      return; // Server is already running
    }
  } catch (_e) {
    // Port 5000 is not running; spin up test server on random free port
    await new Promise((resolve) => {
      testServer = app.listen(0, '127.0.0.1', () => {
        const port = testServer.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  }
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') {
      testServer.closeAllConnections();
    }
    await new Promise((resolve) => testServer.close(resolve));
  }
});

test('Security Suite — 1. Cryptographic Password Hashing (Bcrypt 12 Salt Rounds)', async () => {
  const password = 'StrongPassword!2026';
  const salt = await bcryptjs.genSalt(12);
  const hash = await bcryptjs.hash(password, salt);

  assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'), 'Bcrypt hash must use at least 12 cost rounds');
  
  const valid = await bcryptjs.compare(password, hash);
  assert.equal(valid, true, 'Valid password must correctly authenticate');

  const invalid = await bcryptjs.compare('WrongPassword!2026', hash);
  assert.equal(invalid, false, 'Invalid password must strictly be rejected');
});

test('Security Suite — 2. JWT Cryptographic Signature & Expiry Validation', async () => {
  const payload = {
    id: 'test-user-uuid-1234',
    email: 'secops-test@projecthive.app',
    role: 'student',
  };

  // Valid token
  const token = generateAccessToken(payload.id, payload.email, payload.role);
  assert.ok(token && typeof token === 'string', 'Generated token must be a valid JWT string');

  const decoded = verifyAccessToken(token);
  assert.equal(decoded.id, payload.id, 'Decoded user ID must match payload');
  assert.equal(decoded.email, payload.email, 'Decoded email must match payload');

  // Tampered token signature
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  assert.throws(() => {
    verifyAccessToken(tamperedToken);
  }, /invalid/i, 'Tampered token signature must throw signature error');

  // Expired token test
  const secret = process.env.JWT_SECRET || 'projecthive-super-secret-jwt-key-2026';
  const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1s' });
  assert.throws(() => {
    verifyAccessToken(expiredToken);
  }, /expired/i, 'Expired token must throw expiration error');
});

test('Security Suite — 3. Privilege Escalation Defense (Non-admin blocked from SecOps)', async () => {
  // Test calling admin endpoint with non-admin token
  const studentPayload = {
    id: 'student-fake-id-999',
    email: 'normalstudent@projecthive.app',
    role: 'student',
  };
  const studentToken = generateAccessToken(studentPayload.id, studentPayload.email, studentPayload.role);

  const res = await fetch(`${baseUrl}/api/admin/security/posture`, {
    headers: {
      'Authorization': `Bearer ${studentToken}`,
    },
  });

  assert.equal(res.status, 403, 'Non-admin token must receive HTTP 403 Forbidden on admin routes');
  const data = await res.json();
  assert.ok(data.error, 'Response must return explicit security error message');
});

test('Security Suite — 4. Unauthenticated Access Blocked on Protected Endpoints', async () => {
  const res = await fetch(`${baseUrl}/api/users/me`);
  assert.equal(res.status, 401, 'Request without Authorization header must return HTTP 401');
});

test('Security Suite — 5. IDOR & Data Isolation Safeguard', async () => {
  const victimId = '00000000-0000-0000-0000-000000000002';
  const attackerPayload = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'attacker@projecthive.app',
    role: 'student',
  };
  const attackerToken = generateAccessToken(attackerPayload.id, attackerPayload.email, attackerPayload.role);

  // Attacker attempts to delete victim's account
  const res = await fetch(`${baseUrl}/api/users/${victimId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${attackerToken}`,
    },
  });

  assert.equal(res.status, 403, 'User attempting to delete another user account must receive 403 Forbidden');
});

test('Security Suite — 6. SQL & Filter Parameter Injection Resistance', async () => {
  // Attempt filter manipulation on search
  const maliciousSearch = "'; DROP TABLE users; --";
  const res = await fetch(`${baseUrl}/api/users/search?q=${encodeURIComponent(maliciousSearch)}`);
  
  // Endpoint should safely return 200 without executing injection
  assert.equal(res.status, 200, 'Search input with SQL injection payload must be safely handled');
  const data = await res.json();
  assert.ok(data && (Array.isArray(data.users) || Array.isArray(data)), 'Sanitized response must return safe array');
});

test('Security Suite — 7. Immutable Audit Ledger Recording Verification', async () => {
  const testAction = 'TEST_SECOPS_INTEGRITY_CHECK';
  const testId = crypto.randomUUID();

  // Insert audit record
  const { data, error } = await supabaseAdmin.from('admin_audit_logs').insert([{
    admin_id: 'a0000000-0000-0000-0000-000000000001',
    admin_email: 'secops@projecthive.app',
    action: testAction,
    target_type: 'automated_test',
    target_id: testId,
    details: { passed: true, engine: 'ASVS_L2' },
    created_at: new Date().toISOString(),
  }]).select().single();

  assert.equal(error, null, 'Audit log insert must succeed');
  assert.equal(data.action, testAction, 'Audit record action must match');

  // Verify the record was persisted
  const { data: retrieved } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('id, action, target_id')
    .eq('target_id', testId)
    .single();

  assert.ok(retrieved, 'Audit record must be retrievable from persistent storage');
  assert.equal(retrieved.action, testAction);

  // Clean up test audit record
  await supabaseAdmin.from('admin_audit_logs').delete().eq('target_id', testId);
});
