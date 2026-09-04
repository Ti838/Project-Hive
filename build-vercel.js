import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 [ProjectHive] Starting automated production build...');

try {
  // 1. Install frontend dependencies
  console.log('📦 [ProjectHive] Installing frontend dependencies...');
  execSync('npm --prefix frontend install --include=dev', { stdio: 'inherit' });

  // 2. Build Next.js application
  console.log('🏗️ [ProjectHive] Building Next.js app in frontend/...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });

  // 3. Sync .next build directory to root .next
  const srcNext = path.resolve('frontend', '.next');
  const destNext = path.resolve('.next');

  console.log(`🔄 [ProjectHive] Syncing build artifacts from ${srcNext} to ${destNext}...`);
  if (fs.existsSync(srcNext)) {
    fs.cpSync(srcNext, destNext, { recursive: true, force: true });
    console.log('✅ [ProjectHive] .next synced to root successfully.');
  } else {
    console.error('❌ [ProjectHive] frontend/.next was not found after build!');
    process.exit(1);
  }

  // 4. Ensure public assets are synced
  const srcPublic = path.resolve('frontend', 'public');
  const destPublic = path.resolve('public');
  if (fs.existsSync(srcPublic)) {
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log('✅ [ProjectHive] public folder synced successfully.');
  }

  console.log('🎉 [ProjectHive] Production build completed with 100% success!');
} catch (error) {
  console.error('💥 [ProjectHive] Build process failed:', error.message);
  process.exit(1);
}
