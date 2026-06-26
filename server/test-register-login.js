import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import { supabaseAdmin } from './config/supabase.js';

async function runTest() {
  const email = 'testemailpasswordlogin@test.com';
  const password = 'TestPassword123!';
  
  // 1. Delete if exists
  await supabaseAdmin.from('users').delete().eq('email', email);
  
  // 2. Hash password
  const salt = await bcryptjs.genSalt(12);
  const passwordHash = await bcryptjs.hash(password, salt);
  
  // 3. Insert user (simulating registration but setting is_verified: true)
  const { data: user, error: createError } = await supabaseAdmin
    .from('users')
    .insert({
      first_name: 'Test',
      last_name: 'User',
      email,
      password_hash: passwordHash,
      is_verified: true,
      auth_provider: 'email'
    })
    .select()
    .single();
    
  if (createError) {
    console.error('Failed to create user:', createError);
    return;
  }
  console.log('User created in DB:', user.email);

  // 4. Test login comparison
  const isValid = await bcryptjs.compare(password, user.password_hash);
  console.log('Password comparison isValid:', isValid);
}

runTest();
