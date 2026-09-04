'use client';
// ─── Forgot Password Page ──────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setServerError('');
    const res = await api.auth.forgotPassword(data.email);
    if (!res.ok && res.error) {
      setServerError(res.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
        <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-3xl p-8 shadow-xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <MailCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists with that email, we've sent password reset instructions.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your university email address and we'll send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@university.edu"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-4 py-3 border focus:outline-none focus:border-primary transition-colors',
                    errors.email ? 'border-destructive' : 'border-transparent'
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {serverError && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Sending reset link…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

