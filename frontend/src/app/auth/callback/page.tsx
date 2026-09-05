'use client';
// ─── OAuth Callback Handler ───────────────────────────────────────────────────

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function processOAuth() {
      try {
        // 1. Check for explicit error parameter
        const errorDesc = searchParams.get('error_description') || searchParams.get('error');
        if (errorDesc) {
          if (active) {
            setStatus('error');
            setErrorMessage(decodeURIComponent(errorDesc));
          }
          return;
        }

        // 2. Check for PKCE Authorization Code (?code=...)
        const code = searchParams.get('code');
        if (code) {
          const res = await api.auth.googleCodeExchange(code);
          if (!active) return;
          if (res.ok && res.accessToken && res.user) {
            login(res.user, res.accessToken, res.refreshToken);
            setStatus('success');
            setTimeout(() => router.replace('/dashboard'), 800);
            return;
          } else {
            setStatus('error');
            setErrorMessage(res.error || 'Failed to exchange authorization code with server.');
            return;
          }
        }

        // 3. Check for implicit hash fragment (#access_token=...&refresh_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iekfvgjxkmgduxdvkuxf.supabase.co';
            const sbAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': sbAnonKey,
              },
            });

            if (userRes.ok) {
              const sbUser = await userRes.json();
              const fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '';
              const firstName = sbUser.user_metadata?.first_name || sbUser.user_metadata?.given_name || fullName.split(' ')[0] || 'User';
              const lastName = sbUser.user_metadata?.last_name || sbUser.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || '';
              const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null;

              const res = await api.auth.googleCallback({
                email: sbUser.email,
                googleId: sbUser.id,
                firstName,
                lastName,
                avatar,
                supabaseAccessToken: accessToken,
              });

              if (!active) return;
              if (res.ok && res.accessToken && res.user) {
                login(res.user, res.accessToken, res.refreshToken);
                setStatus('success');
                setTimeout(() => router.replace('/dashboard'), 600);
                return;
              } else {
                setStatus('error');
                setErrorMessage(res.error || 'Failed to authenticate user with ProjectHive server.');
                return;
              }
            }
          }
        }

        // 4. If neither code nor valid tokens found
        if (active) {
          setStatus('error');
          setErrorMessage('No authentication credentials returned from authorization provider.');
        }
      } catch (err: any) {
        if (active) {
          setStatus('error');
          setErrorMessage(err?.message || 'An unexpected error occurred during OAuth processing.');
        }
      }
    }

    processOAuth();

    return () => {
      active = false;
    };
  }, [searchParams, router, login]);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
      <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center">
        {status === 'loading' && (
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {status === 'loading' && 'Authenticating with Hive…'}
        {status === 'success' && 'Signed In Successfully!'}
        {status === 'error' && 'Authentication Failed'}
      </h1>

      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {status === 'loading' && 'Please wait while we verify your credentials and initialize your session.'}
        {status === 'success' && 'Welcome back! Redirecting you to your ProjectHive dashboard…'}
        {status === 'error' && (errorMessage || 'Could not complete sign-in. Please try again.')}
      </p>

      {status === 'error' && (
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Initializing OAuth session…</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
