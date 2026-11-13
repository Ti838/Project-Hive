'use client';
// ─── ProjectHive — Modern Sign In Page (Harmonized Auth System) ─────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, ArrowLeft, Lock, Mail,
  Sparkles, Users, Video, ShieldCheck, AlertCircle, MailCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';
import { Button, Input, Badge } from '@/components/ui';
import { Auth3DCanvas } from '@/components/3d';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setRequiresVerification(false);
    setResendMsg('');
    const deviceMeta = await getExactDeviceDetails();
    const res = await api.auth.login(data.email, data.password, deviceMeta);
    if (!res.ok || res.error) {
      if (res.requiresVerification || (res.error && res.error.toLowerCase().includes('verify your email'))) {
        setRequiresVerification(true);
        setUnverifiedEmail(res.email || data.email);
        setServerError('Please verify your email address to access your workspace.');
        return;
      }
      setServerError(res.error ?? 'Invalid email or password');
      return;
    }
    login(res.user, res.accessToken, res.refreshToken);
    router.push('/dashboard');
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setResendMsg('');
      const res = await api.auth.resendVerification(unverifiedEmail);
      setIsResending(false);
      setResendMsg(res.message || 'Verification link resent. Please check your inbox.');
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
      setResendMsg('Failed to resend. Please try again shortly.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setServerError('');
      setIsGoogleLoading(true);
      const res = await api.auth.googleInitiate();
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setServerError(res.error || 'Failed to connect to Google Sign-In. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setServerError(err?.message || 'Unexpected error during Google Sign-In.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500/20">
      {/* Top Navigation Bar with Back to Home */}
      <header className="w-full px-4 sm:px-8 py-3.5 border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight hidden sm:inline text-white">
            Project<span className="text-amber-400">Hive</span>
          </span>
        </Link>
      </header>

      {/* Main Content Split Layout */}
      <div className="flex-1 flex w-full max-w-6xl mx-auto items-center justify-center p-4 sm:p-6 lg:p-8 py-6 sm:py-12">
        <div className="w-full grid lg:grid-cols-12 gap-8 items-stretch bg-[#0d1117]/90 border border-white/[0.1] rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">

          {/* Left Feature Branding with Interactive 3D Canvas (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0a0e17] to-[#07090e] border border-amber-500/20 min-h-[640px] relative overflow-hidden shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-2.5 shadow-inner">
                  <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
                </div>
                <Badge variant="amber" size="sm" dot>STUDENT WORKSPACE</Badge>
              </div>

              {/* Interactive 3D Key of Knowledge Canvas */}
              <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-black/50 border border-amber-500/25 shadow-inner flex items-center justify-center">
                <Auth3DCanvas mode="signin" className="w-full h-full" />
                <div className="absolute bottom-2 left-3 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-amber-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>3D Security Core • Orbit with pointer</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                  Welcome Back to ProjectHive
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Log in to your workspace to collaborate with your team, join live calls, and build projects.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { icon: Users, text: 'Real-time squad matching & team channels' },
                  { icon: Video, text: 'Instant HD WebRTC video calls & whiteboard' },
                  { icon: Sparkles, text: 'HiveMind AI Assistant & Project Architect' },
                  { icon: ShieldCheck, text: 'Secure student authentication & Zero-Trust RLS' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-200">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
              <span>Trusted by university builders</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Platform
              </span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-lg mx-auto w-full">
            {/* Quick Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl mb-6 border border-white/[0.08] text-center text-xs font-semibold">
              <span className="py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-sm">
                Sign In
              </span>
              <Link
                href="/register"
                className="py-2.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Create Account
              </Link>
            </div>

            <div className="space-y-1.5 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Enter your university credentials to continue
              </p>
            </div>

            {/* Google OAuth Quick Sign-In */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              className="w-full mb-6 font-semibold"
              leftIcon={
                !isGoogleLoading && (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )
              }
            >
              {isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </Button>

            {/* Visual Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.1]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0d1117] px-3 text-slate-400 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <Input
                {...register('email')}
                label="Email Address"
                type="email"
                placeholder="you@university.edu"
                error={errors.email?.message}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
              />

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-amber-400 font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {/* Server error feedback */}
              {serverError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-1">
                    <p>{serverError}</p>
                    {requiresVerification && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={isResending || resendCooldown > 0}
                          className="inline-flex items-center gap-1 text-amber-400 hover:underline font-semibold cursor-pointer"
                        >
                          <MailCheck className="w-3.5 h-3.5" />
                          <span>
                            {resendCooldown > 0
                              ? `Resend available in ${resendCooldown}s`
                              : 'Resend Verification Email'}
                          </span>
                        </button>
                        {resendMsg && <p className="text-[11px] text-emerald-400 mt-1">{resendMsg}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="glow"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-2"
              >
                {isSubmitting ? 'Signing in…' : 'Sign In to Workspace'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-amber-400 font-semibold hover:underline">
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
