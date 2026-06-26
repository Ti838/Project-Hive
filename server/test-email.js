import 'dotenv/config';
import { sendVerificationEmail } from './services/email.service.js';

async function test() {
  try {
    console.log('Sending test verification email to timonbiswas33@gmail.com...');
    const result = await sendVerificationEmail('timonbiswas33@gmail.com', 'TestUser', 'dummy-token-123');
    console.log('Result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
