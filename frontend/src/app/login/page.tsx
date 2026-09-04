'use client';
// ─── ProjectHive — Modern Sign In Page ──────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, ArrowLeft, Lock, Mail,
  Sparkles, Users, Video, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    const deviceMeta = await getExactDeviceDetails();
    const res = await api.auth.login(data.email, data.password, deviceMeta);
    if (!res.ok || res.error) {
      setServerError(res.error ?? 'Invalid email or password');
      return;
    }
    login(res.user, res.accessToken, res.refreshToken);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ─── Top Navigation Bar with Back to Home ───────────────────── */}
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

      {/* ─── Main Content Split Layout ──────────────────────────────── */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full grid lg:grid-cols-12 gap-8 items-center bg-card/60 border border-border/80 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xl backdrop-blur-xl">

          {/* Left Feature Branding (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 min-h-[500px]">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center p-3 shadow-inner">
                <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight">Welcome Back to ProjectHive</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Log in to your workspace to collaborate with your team, join live calls, and build projects.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { icon: Users, text: 'Real-time squad matching & team channels' },
                  { icon: Video, text: 'Instant HD WebRTC video calls & whiteboard' },
                  { icon: Sparkles, text: 'Groq & Gemini AI Copilot brainstorming' },
                  { icon: ShieldCheck, text: 'Verified student authentication & security' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-medium text-foreground/90">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span>Trusted by student builders</span>
              <span className="font-semibold text-primary">Live Platform</span>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-4 max-w-md mx-auto w-full">
            {/* Quick Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6 border border-border/60 text-center text-xs font-semibold">
              <span className="py-2 rounded-lg bg-background text-foreground shadow-xs">Sign In</span>
              <Link
                href="/register"
                className="py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Create Account
              </Link>
            </div>

            <div className="space-y-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign in to your account</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Enter your university credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
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
                  spellCheck={false}
                  placeholder="you@university.edu"
                  className={cn(
                    'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                    errors.email ? 'border-destructive' : 'border-border/80'
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
              </div>

              {/* Server error */}
              {serverError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-md mt-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/60 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Create one free
                </Link>
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                Are you an administrator?{' '}
                <Link href="/admin/login" className="text-muted-foreground hover:text-foreground underline">
                  Admin login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

