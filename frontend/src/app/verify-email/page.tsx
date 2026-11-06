'use client';
// ─── Verify Email Page ─────────────────────────────────────────────────────────

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, MailCheck, ShieldCheck, Mail } from 'lucide-react';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Resend state for expired or invalid links
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token found in URL. Please check your verification link or request a new one.');
      setShowResend(true);
      return;
    }

    let isMounted = true;
    api.auth.verifyEmail(token)
      .then((res) => {
        if (!isMounted) return;
        setLoading(false);
        if (res.ok) {
          setSuccess(true);
          setMessage(res.message || 'Email verified successfully! Welcome to ProjectHive.');
          setTimeout(() => {
            router.push('/login');
          }, 2800);
        } else {
          setError(res.error || 'Verification link is invalid or has expired.');
          setShowResend(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        setError(err?.message || 'Verification failed. Please try again.');
        setShowResend(true);
      });

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setResendMessage('');
      const res = await api.auth.resendVerification(resendEmail);
      setIsResending(false);
      setResendMessage(res.message || 'If an unverified account exists with that email, a new link was sent.');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setIsResending(false);
      setResendMessage('Failed to resend. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center">
        {loading ? (
          <div className="w-16 h-16 bg-primary/10 border border-primary/25 rounded-3xl flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : success ? (
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-center justify-center text-emerald-500 animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/25 rounded-3xl flex items-center justify-center text-destructive animate-in zoom-in-95">
            <XCircle className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          {loading ? 'Verifying Your Email…' : success ? 'Email Verified!' : 'Verification Failed'}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {loading
            ? 'Please wait while we confirm your university credentials with the platform.'
            : success
            ? message
            : error}
        </p>
      </div>

      {success && (
        <div className="pt-2 animate-in fade-in">
          <Link
            href="/login"
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {showResend && !success && (
        <div className="pt-4 border-t border-border/60 text-left space-y-3 animate-in fade-in">
          <p className="text-xs font-semibold text-foreground">Need a new verification link?</p>
          <form onSubmit={handleResend} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full h-10 text-xs bg-muted/60 rounded-xl px-3 border border-border/80 focus:outline-none focus:border-primary focus:bg-background"
              />
            </div>
            <button
              type="submit"
              disabled={isResending || resendCooldown > 0}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-accent disabled:opacity-50 transition-all border border-border"
            >
              {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send New Verification Link'}
              </span>
            </button>
          </form>
          {resendMessage && (
            <p className="text-xs text-primary font-medium text-center">{resendMessage}</p>
          )}
        </div>
      )}

      <div className="pt-2">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-3.5 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="w-full max-w-md h-72 bg-card rounded-3xl animate-pulse" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
