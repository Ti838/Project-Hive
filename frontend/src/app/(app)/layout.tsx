'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import { BRAND_CONFIG } from '@/lib/brandConfig';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'admin' || user?.role === 'super_admin') {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading {BRAND_CONFIG.name}…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === 'admin' || user?.role === 'super_admin') return null;

  return <AppShell>{children}</AppShell>;
}
