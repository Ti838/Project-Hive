import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function test() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, is_verified, password_hash, auth_provider')
      .limit(10);
    
    if (error) throw error;
    
    users.forEach(u => {
      console.log(`Email: ${u.email} | Verified: ${u.is_verified} | Provider: ${u.auth_provider} | Password Hash: ${u.password_hash ? u.password_hash.substring(0, 15) + '...' : 'NULL'}`);
    });
  } catch (error) {
    console.error('DB test failed:', error);
  }
}

test();
