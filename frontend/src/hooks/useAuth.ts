'use client';
// ─── useAuth — Authentication Guard Hook ──────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

/** Redirect to /login if not authenticated. Returns current user. */
export function useAuth(redirectTo = '/login') {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }
    // Re-validate user from backend on mount to catch bans / changes
    api.users.me().then((res) => {
      if (!res.ok || res.error) {
        logout();
        router.replace('/login');
      }
    });
  }, [isAuthenticated, isLoading]);

  return { user, isAuthenticated, isLoading };
}

/** Redirect to /dashboard if already authenticated (for login/register pages). */
export function useGuestOnly(redirectTo = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading]);

  return { isLoading };
}
