'use client';

import { use, Suspense } from 'react';
import ProfilePage from '../page';

export default function DynamicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-6 max-w-3xl mx-auto animate-pulse"><div className="h-40 bg-muted rounded-2xl" /></div>}>
      <ProfilePage paramsId={resolvedParams.id} />
    </Suspense>
  );
}

