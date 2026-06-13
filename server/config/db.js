import { supabaseAdmin } from '../config/supabase.js';

export async function connectDB() {
  try {
    console.log('[ProjectHive] Connecting to Supabase...');
    // Test connection with a simple query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table not found (schema not run yet)
      if (error.code === '42P01') {
        console.warn('[ProjectHive] ⚠️  Database tables not found!');
        console.warn('[ProjectHive]    Run the SQL schema in Supabase Dashboard → SQL Editor');
        console.warn('[ProjectHive]    File: server/database/schema.sql');
      } else {
        throw error;
      }
    }

    console.log('[ProjectHive] ✅ Supabase connected successfully');
    return supabaseAdmin;
  } catch (error) {
    console.error('[ProjectHive] ❌ Supabase connection error:', error.message);
    process.exit(1);
  }
}

export function disconnectDB() {
  // Supabase uses HTTP — no persistent connection to close
  console.log('[ProjectHive] Supabase disconnected');
}
