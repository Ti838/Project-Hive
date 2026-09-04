'use client';
// ─── Verify Email Page ─────────────────────────────────────────────────────────

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token found in URL. Please check your verification link.');
      return;
    }

    let isMounted = true;
    api.auth.verifyEmail(token)
      .then((res) => {
        if (!isMounted) return;
        setLoading(false);
        if (res.ok) {
          setSuccess(true);
          setMessage(res.message || 'Email verified successfully! Welcome to ProjectHive 🐝');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setError(res.error || 'Verification link is invalid or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        setError(err?.message || 'Verification failed. Please try again.');
      });

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
      <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center">
        {loading ? (
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : success ? (
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive">
            <XCircle className="w-8 h-8" />
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {loading ? 'Verifying Your Email…' : success ? 'Email Verified!' : 'Verification Failed'}
      </h1>

      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {loading
          ? 'Please wait while we confirm your university credentials with the hive.'
          : success
          ? message
          : error}
      </p>

      {success && (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-muted-foreground">Redirecting to sign in automatically…</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && !success && (
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            Back to Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-medium text-xs transition-colors"
          >
            Create a New Account
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-2xs">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight hidden sm:inline">ProjectHive</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Connecting to verification service…</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
