import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iekfvgjxkmgduxdvkuxf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2Z2Z2p4a21nZHV4ZHZrdXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjI2MjEsImV4cCI6MjA5Njg5ODYyMX0.s73x7IQTDae7TPD0AoJmH9m6Ip0SKQPV5Ozr9v5nACg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  try {
    // Try to fetch system flags
    const { data: flags, error: flagsErr } = await supabase.from('system_flags').select('*');
    console.log('System Flags in DB:', flags || flagsErr);

    // Try to fetch public users
    const { data: users, error: usersErr } = await supabase.from('users').select('id, email, first_name, is_verified, role').limit(10);
    console.log('Users in DB:', users || usersErr);
  } catch (error) {
    console.error('DB test failed:', error);
  }
}

test();
