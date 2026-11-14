'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Mail,
  Sparkles,
  Users,
  Video,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid university or personal email'),
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email') || '';

  // Real-time university academic domain badge
  const detectedUniversity = useMemo(() => {
    const lower = emailValue.toLowerCase();
    if (lower.includes('buet.ac.bd')) return 'BUET Verified Student';
    if (lower.includes('du.ac.bd')) return 'Dhaka University Verified';
    if (lower.includes('bracu.ac.bd')) return 'BRAC University Verified';
    if (lower.includes('northsouth.edu') || lower.includes('nsu.edu')) return 'NSU Verified Student';
    if (lower.includes('sust.edu')) return 'SUST Verified Student';
    if (lower.includes('iut-dhaka.edu')) return 'IUT Verified Student';
    if (lower.includes('aiub.edu')) return 'AIUB Verified Student';
    if (lower.includes('.edu') || lower.includes('.ac.bd')) return 'Recognized Academic Domain';
    return null;
  }, [emailValue]);

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
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500/20">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-white/[0.08] bg-[#090d16]/80 backdrop-blur-md flex items-center justify-between">
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
          <span className="font-extrabold text-base tracking-tight text-white">
            Project<span className="text-amber-400">Hive</span>
          </span>
        </Link>
      </header>

      {/* ── Main Login Layout ────────────────────────────────────────── */}
      <main className="flex-1 flex w-full max-w-5xl mx-auto items-center justify-center p-4 sm:p-6 lg:p-8 my-6">
        <div className="w-full grid lg:grid-cols-12 gap-8 items-stretch bg-[#0d1117] border border-white/[0.1] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
          
          {/* Left Brand Panel (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0a0e17] to-[#07090e] border border-amber-500/20 relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-2.5 shadow-inner">
                  <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Incubation Mesh
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Welcome back to your workspace.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Collaborate with your squad, join LiveKit 4K video rooms, and scaffold your capstone with HiveMind AI.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 mt-8">
                {[
                  { icon: Users, title: 'Smart Squad Matchmaking', desc: 'Find teammates across verified universities' },
                  { icon: Video, title: 'LiveKit SFU 4K Calls', desc: 'Low-latency screen sharing and audio' },
                  { icon: Sparkles, title: 'HiveMind AI Copilot', desc: 'Groq & Gemini Flash sprint assistance' },
                  { icon: ShieldCheck, title: 'Zero-Trust Security', desc: 'PostgreSQL Row-Level Security isolation' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
              <span>Verified student network</span>
              <span className="text-amber-400 font-semibold">ProjectHive 2.0</span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-lg mx-auto w-full">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Student Sign In</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Enter your university or personal email to access your squads and projects.
              </p>
            </div>

            {/* Google Workspace Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm mb-5 cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google Workspace</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute px-3 bg-[#0d1117] text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                or sign in with email
              </span>
            </div>

            {/* Error Notification */}
            {serverError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            {/* Unverified Email Resend Notice */}
            {requiresVerification && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <p className="text-xs text-amber-200">
                  Verification email sent to <strong className="text-white">{unverifiedEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                </button>
                {resendMsg && <p className="text-[11px] text-amber-300 mt-1">{resendMsg}</p>}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  {detectedUniversity && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {detectedUniversity}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="student@university.ac.bd"
                    {...register('email')}
                    className={`w-full h-11 pl-10 pr-4 bg-white/[0.04] border ${
                      errors.email ? 'border-rose-500/70' : 'border-white/[0.1] focus:border-amber-500/60'
                    } rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-sans`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    {...register('password')}
                    className={`w-full h-11 pl-10 pr-10 bg-white/[0.04] border ${
                      errors.password ? 'border-rose-500/70' : 'border-white/[0.1] focus:border-amber-500/60'
                    } rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-sans`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4">
                  Create Account
                </Link>
              </p>
              <div>
                <Link
                  href="/admin/login"
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Institutional Administrator? Sign In Here &rarr;
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-white/[0.06]">
        &copy; {new Date().getFullYear()} ProjectHive. The University Incubation Mesh.
      </footer>
    </div>
  );
}
