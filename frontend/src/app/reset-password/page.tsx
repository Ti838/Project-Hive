'use client';
// ─── Reset Password Page ────────────────────────────────────────────────────────

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, KeyRound, CheckCircle2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
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

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const passwordVal = watch('password') || '';

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-destructive' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const strength = getPasswordStrength(passwordVal);

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
    <div className="w-full max-w-md space-y-6 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
      <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to sign in
      </Link>

      {!token ? (
        <div className="text-center space-y-4 py-4 animate-in fade-in">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/25 rounded-3xl flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No valid recovery token was detected in your link. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold text-center hover:bg-primary/90 transition-colors shadow-md"
          >
            Request New Link
          </Link>
        </div>
      ) : success ? (
        <div className="text-center space-y-4 py-4 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Password Reset Complete!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been securely updated. Redirecting you to sign in…
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold text-center hover:bg-primary/90 transition-colors shadow-md"
          >
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Set new password</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create a strong password of at least 8 characters for your ProjectHive account.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90">New Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                autoComplete="new-password"
                className={cn(
                  'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 pr-11 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                  errors.password ? 'border-destructive' : 'border-border/80'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

            {/* Strength Meter */}
            {passwordVal.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Strength: {strength.label}</span>
                  <span className="text-muted-foreground font-mono">{strength.score}/4</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        'flex-1 h-full rounded-full transition-all duration-300',
                        strength.score >= step ? strength.color : 'bg-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90">Confirm New Password</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className={cn(
                  'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 pr-11 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                  errors.confirmPassword ? 'border-destructive' : 'border-border/80'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
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
            {isSubmitting ? 'Updating Password…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="w-full max-w-md h-80 bg-card rounded-3xl animate-pulse" />}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
