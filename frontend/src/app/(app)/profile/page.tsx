'use client';

import { Suspense } from 'react';
import { ProfileView } from '@/components/profile/ProfileView';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-3xl mx-auto animate-pulse"><div className="h-40 bg-muted rounded-2xl" /></div>}>
      <ProfileView />
    </Suspense>
  );
}
