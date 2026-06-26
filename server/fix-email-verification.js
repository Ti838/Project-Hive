import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixEmailVerification() {
  try {
    console.log('🔧 Turning OFF forced email verification...\n');

    const { data, error } = await supabaseAdmin
      .from('system_flags')
      .update({ value: false })
      .eq('key', 'emailVerification')
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Email verification requirement DISABLED!');
    console.log('   You can now login without email verification.');
    console.log('\n📧 Try logging in now with:');
    console.log('   Email: aloneboy0022.ti@gmail.com');
    console.log('   Password: timon0022');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fixEmailVerification();
