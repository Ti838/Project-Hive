import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ProjectHive] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.warn('[ProjectHive] ⚠️  Missing SUPABASE_ANON_KEY — Google OAuth will not work');
}

// Public client (for OAuth URL generation — server-safe config)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Admin client (bypasses RLS — use only in server-side code)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
