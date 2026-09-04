'use client';
// ─── Reset Password Page ────────────────────────────────────────────────────────

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, KeyRound, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      setServerError('Missing reset token. Please request a new password reset link.');
      return;
    }

    setServerError('');
    const res = await api.auth.resetPassword(token, data.password);
    if (!res.ok || res.error) {
      setServerError(res.error || 'Failed to reset password. The link may have expired.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 2500);
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-2xl p-8 shadow-sm">
      <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>

      {!token ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground">
            No reset token was detected in your link. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors shadow-xs"
          >
            Request New Link
          </Link>
        </div>
      ) : success ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Password Reset Complete!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been securely updated. Redirecting you to sign in…
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors shadow-xs"
          >
            Proceed to Login Now
          </Link>
        </div>
      ) : (
        <>
          <div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Please enter and confirm your new secure password below.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">New Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-4 py-3 pr-12 border focus:outline-none focus:border-primary transition-colors',
                    errors.password ? 'border-destructive' : 'border-transparent'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Confirm New Password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-4 py-3 pr-12 border focus:outline-none focus:border-primary transition-colors',
                    errors.confirmPassword ? 'border-destructive' : 'border-transparent'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Updating password…' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading password reset…</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
