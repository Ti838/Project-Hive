import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('Checking database tables...');
  
  const tables = [
    'users',
    'friends',
    'friend_requests',
    'follows',
    'blocks',
    'notifications',
    'stories',
    'story_views',
    'message_reactions',
    'system_flags',
    'skill_endorsements',
    'saved_posts'
  ];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('*').limit(1);
    console.log(`${table} check:`, { exists: !error, error: error ? error.message : null });
  }
}

check();
