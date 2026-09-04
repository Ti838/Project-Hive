'use client';
// ─── ProjectHive Admin Root Router ────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminRootPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user?.role === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-4 shadow-sm">
        <ShieldCheck className="w-6 h-6 animate-pulse" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">ProjectHive Admin Console</h1>
      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verifying administrative authorization...
      </p>
    </div>
  );
}

