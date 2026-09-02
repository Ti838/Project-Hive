'use client';

import { Suspense } from 'react';
import ProfilePage from '../page';

export default function ProfileViewPage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-3xl mx-auto animate-pulse"><div className="h-40 bg-muted rounded-2xl" /></div>}>
      <ProfilePage />
    </Suspense>
  );
}

