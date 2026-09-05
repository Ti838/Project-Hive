import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('[ProjectHive] ❌ Missing SUPABASE_URL in environment.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('[ProjectHive] ❌ FATAL: Missing SUPABASE_SERVICE_ROLE_KEY. Server cannot bypass RLS without service_role credentials.');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.warn('[ProjectHive] ⚠️  Missing SUPABASE_ANON_KEY — Client-side OAuth exchange may be limited.');
}

// ── Public client (OAuth URL generation & PKCE flow fallback) ────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    flowType: 'implicit',
  },
  db: {
    schema: 'public',
  },
});

// ── Admin client (STRICT: Bypasses RLS — for all server-side queries & mutations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Validates Supabase query response and throws structured errors.
 * Guarantees { data, error } is checked explicitly before JSON serialization.
 *
 * @param {{ data: any, error: any }} result
 * @param {string} [context='Database operation failed']
 * @returns {any} Unwrapped data
 */
export function assertDbSuccess(result, context = 'Database operation failed') {
  if (!result) {
    const err = new Error(`${context}: Empty response returned from database`);
    err.status = 500;
    throw err;
  }
  if (result.error) {
    const err = new Error(`${context}: ${result.error.message || result.error.details || 'Unknown database error'}`);
    err.code = result.error.code;
    err.details = result.error.details;
    err.hint = result.error.hint;
    err.status = result.error.code === 'PGRST116' ? 404 : 500;
    throw err;
  }
  return result.data;
}

export default supabaseAdmin;
