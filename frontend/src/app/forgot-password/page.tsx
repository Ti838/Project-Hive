'use client';
// ─── Forgot Password Page ──────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, MailCheck, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setServerError('');
    setSubmittedEmail(data.email);
    const res = await api.auth.forgotPassword(data.email);
    if (!res.ok && res.error) {
      setServerError(res.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-3.5 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Sign In</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-2xs">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight hidden sm:inline">ProjectHive</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 bg-card/70 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">

          {submitted ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-primary/10 border border-primary/25 rounded-3xl flex items-center justify-center mx-auto text-primary shadow-sm">
                <MailCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <br />
                  <strong className="text-foreground font-semibold">{submittedEmail}</strong>, <br />
                  we have dispatched password recovery instructions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 text-xs text-muted-foreground text-left space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Security Guidance</span>
                </div>
                <p>• The reset link is single-use and will expire in 60 minutes.</p>
                <p>• Check your spam or promotional folders if the email doesn&apos;t arrive shortly.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  className="w-full h-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  Return to Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium pt-1"
                >
                  Try a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reset your password</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter your registered email address and we&apos;ll send you a secure link to recover your account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    className={cn(
                      'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                      errors.email ? 'border-destructive' : 'border-border/80'
                    )}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {serverError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Sending Link…' : 'Send Reset Link'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link href="/login" className="text-xs text-primary font-medium hover:underline">
                  Remember your password? Sign in
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
