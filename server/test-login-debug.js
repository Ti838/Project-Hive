import bcryptjs from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testLogin() {
  try {
    // CHANGE THIS TO YOUR EMAIL
    const testEmail = 'aloneboy0022.ti@gmail.com'; // <-- PUT YOUR EMAIL HERE
    const testPassword = 'timon0022';              // <-- PUT YOUR PASSWORD HERE

    console.log('\n🔍 Searching for user:', testEmail);

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail.toLowerCase())
      .single();

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    if (!user) {
      console.error('❌ User not found in database!');
      return;
    }

    console.log('\n✅ User found!');
    console.log('   - ID:', user.id);
    console.log('   - Name:', user.first_name, user.last_name);
    console.log('   - Email:', user.email);
    console.log('   - Is Verified:', user.is_verified);
    console.log('   - Is Banned:', user.is_banned);
    console.log('   - Role:', user.role);
    console.log('   - Auth Provider:', user.auth_provider || 'email');
    console.log('   - Has Password Hash:', !!user.password_hash);

    if (!user.password_hash) {
      console.error('\n❌ No password hash found! This account might be created with Google OAuth.');
      return;
    }

    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcryptjs.compare(testPassword, user.password_hash);

    if (isValid) {
      console.log('✅ Password is CORRECT!');
    } else {
      console.error('❌ Password is INCORRECT!');
    }

    // Check email verification flag
    console.log('\n📧 Email Verification Check:');
    if (user.is_verified) {
      console.log('✅ Email is verified');
    } else {
      console.log('⚠️  Email is NOT verified');
      console.log('   - Verification token:', user.email_verification_token ? 'exists' : 'none');
      console.log('   - Token expires:', user.email_verification_expires);
    }

    // Check admin flags
    console.log('\n🔧 Checking admin flags...');
    const { data: flags } = await supabaseAdmin
      .from('admin_flags')
      .select('*')
      .single();

    if (flags) {
      console.log('   - Registration enabled:', flags.registration_enabled);
      console.log('   - Email verification required:', flags.email_verification);
    }

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error(err);
  }
}

testLogin();
