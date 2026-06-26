import bcryptjs from 'bcryptjs';

async function test() {
  const password = 'ProjectHive@Admin2026!';
  const salt = await bcryptjs.genSalt(12);
  const passwordHash = await bcryptjs.hash(password, salt);
  console.log('Hashed password:', passwordHash);

  const isValid = await bcryptjs.compare(password, passwordHash);
  console.log('IsValid:', isValid);

  const isInvalid = await bcryptjs.compare('wrong-password', passwordHash);
  console.log('IsInvalid (should be false):', isInvalid);
}

test();
