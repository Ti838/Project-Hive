'use client';
// ─── ProjectHive — Modern Register Page (Harmonized Auth System) ────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, ArrowLeft, Lock, Mail,
  User, School, Sparkles, Users, Video, ShieldCheck, MailCheck, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BANGLADESH_UNIVERSITIES } from '@/lib/universities';
import { LegalModal } from '@/components/legal/LegalModal';
import { Button, Input, Badge } from '@/components/ui';
import { Auth3DCanvas } from '@/components/3d';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:      z.string().email('Please enter a valid university or student email address'),
  university: z.string().min(2, 'University or institution name is required'),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and acknowledge the Privacy Policy to proceed',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  // Waiting for email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accept_terms: false,
    },
  });

  const passwordVal = watch('password') || '';

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
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

  const handleGoogleSignUp = async () => {
    try {
      setServerError('');
      setIsGoogleLoading(true);
      const res = await api.auth.googleInitiate();
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setServerError(res.error || 'Failed to connect to Google Sign-Up. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setServerError(err?.message || 'Unexpected error during Google Sign-Up.');
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    const res = await api.auth.register({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      university: data.university,
    });

    if (!res.ok || res.error) {
      setServerError(res.error ?? 'Registration failed. Please check your information.');
      return;
    }

    setRegisteredEmail(data.email);
    setVerificationPending(true);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setResendMsg('');
      const res = await api.auth.resendVerification(registeredEmail);
      setIsResending(false);
      setResendMsg(res.message || 'Verification link resent. Please check your email.');
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

          {/* Left Feature Branding with Interactive 3D Mesh (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0a0e17] to-[#07090e] border border-amber-500/20 min-h-[640px] relative overflow-hidden shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-2.5 shadow-inner">
                  <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
                </div>
                <Badge variant="amber" size="sm" dot>COMMUNITY INCUBATION</Badge>
              </div>

              {/* Interactive 3D Neural Collaboration Mesh Canvas */}
              <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-black/50 border border-amber-500/25 shadow-inner flex items-center justify-center">
                <Auth3DCanvas mode="signup" className="w-full h-full" />
                <div className="absolute bottom-2 left-3 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-amber-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>3D Neural Mesh • Orbit with pointer</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                  Join ProjectHive
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Join student developers, designers, and innovators building capstones and software together.
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
              <span>Verified university collaboration</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Open Community
              </span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-lg mx-auto w-full">
            {verificationPending ? (
              /* Email Verification Waiting Screen */
              <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-amber-400 shadow-sm">
                  <MailCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Check your email</h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                    We sent an account verification link to <br />
                    <strong className="text-white font-semibold">{registeredEmail}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 text-left space-y-2 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Next Steps</span>
                  </div>
                  <p>1. Open your inbox and look for the verification email from ProjectHive.</p>
                  <p>2. Click <strong>&quot;Verify My Email&quot;</strong> to activate your account.</p>
                  <p>3. Return to sign in to your workspace.</p>
                </div>

                {resendMsg && (
                  <p className="text-xs font-medium text-emerald-400 animate-in fade-in">
                    {resendMsg}
                  </p>
                )}

                <div className="flex flex-col gap-3 pt-2 max-w-md mx-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleResend}
                    isLoading={isResending}
                    disabled={resendCooldown > 0}
                    className="w-full"
                  >
                    {resendCooldown > 0
                      ? `Resend link in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </Button>

                  <Link href="/login" className="w-full">
                    <Button variant="glow" size="md" className="w-full">
                      Continue to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
                {/* Quick Switch Tabs */}
                <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl mb-5 border border-white/[0.08] text-center text-xs font-semibold">
                  <Link
                    href="/login"
                    className="py-2.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <span className="py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-sm">
                    Create Account
                  </span>
                </div>

                <div className="space-y-1.5 mb-5">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Create your account</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Fill in your information to get started for free</p>
                </div>

                {/* Google OAuth Quick Sign-Up */}
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleGoogleSignUp}
                  isLoading={isGoogleLoading}
                  className="w-full mb-5 font-semibold"
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
                  {isGoogleLoading ? 'Connecting to Google…' : 'Sign up with Google'}
                </Button>

                {/* Visual Divider */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.1]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0d1117] px-3 text-slate-400 font-medium">
                      Or register with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      {...register('first_name')}
                      label="First Name"
                      placeholder="Alex"
                      error={errors.first_name?.message}
                      leftIcon={<User className="w-4 h-4 text-slate-400" />}
                      autoCapitalize="words"
                      autoComplete="given-name"
                    />

                    <Input
                      {...register('last_name')}
                      label="Last Name"
                      placeholder="Morgan"
                      error={errors.last_name?.message}
                      leftIcon={<User className="w-4 h-4 text-slate-400" />}
                      autoCapitalize="words"
                      autoComplete="family-name"
                    />
                  </div>

                  {/* University */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none">
                      University / Institution
                    </label>
                    <div className="relative">
                      <Input
                        {...register('university')}
                        list="ugc-universities"
                        placeholder="Search university (e.g. DU, BUET, NSU, BRACU, MIT...)"
                        error={errors.university?.message}
                        leftIcon={<School className="w-4 h-4 text-slate-400" />}
                        autoCapitalize="words"
                        autoComplete="off"
                      />
                      <datalist id="ugc-universities">
                        {BANGLADESH_UNIVERSITIES.map((uni) => (
                          <option key={uni} value={uni} />
                        ))}
                      </datalist>
                    </div>

                    {/* Popular University Chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 mr-1">Popular:</span>
                      {['DU', 'BUET', 'NSU', 'BRACU', 'IUB', 'AIUB', 'SUST', 'UIU'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const match = BANGLADESH_UNIVERSITIES.find((u) => u.toLowerCase().includes(chip.toLowerCase())) || chip;
                            setValue('university', match, { shouldValidate: true });
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-300 border border-white/[0.08] transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

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

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none">
                        Password
                      </label>
                      <Input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Min 6 characters"
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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none">
                        Confirm Password
                      </label>
                      <Input
                        {...register('confirm_password')}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        error={errors.confirm_password?.message}
                        leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      />
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordVal.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Strength: {strength.label}</span>
                        <span className="text-slate-400 font-mono">{strength.score}/4</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex gap-1">
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

                  {/* Terms & Conditions Acceptance */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-slate-400 select-none cursor-pointer">
                      <input
                        {...register('accept_terms')}
                        type="checkbox"
                        className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-amber-400 h-4 w-4 bg-white/5 cursor-pointer"
                      />
                      <span className="leading-tight">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLegalModal('terms');
                          }}
                          className="text-amber-400 font-medium hover:underline inline-flex items-center cursor-pointer"
                        >
                          Terms of Service
                        </button>{' '}
                        and acknowledge the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLegalModal('privacy');
                          }}
                          className="text-amber-400 font-medium hover:underline inline-flex items-center cursor-pointer"
                        >
                          Privacy Policy
                        </button>.
                      </span>
                    </label>
                    {errors.accept_terms && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.accept_terms.message}</p>
                    )}
                  </div>

                  {/* Server error */}
                  {serverError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{serverError}</span>
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
                    {isSubmitting ? 'Creating account…' : 'Create Free Account'}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
                  <p className="text-xs text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-amber-400 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Accessible In-Flow Legal Modals */}
      <LegalModal
        isOpen={!!legalModal}
        onClose={() => setLegalModal(null)}
        type={legalModal}
      />
    </div>
  );
}
