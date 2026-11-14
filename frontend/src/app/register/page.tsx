'use client';
// ─── ProjectHive — Student & Researcher Registration Portal ───────────────────
// Reverse-engineered from: WorkOS AuthKit, Clerk, and Linear.
// Engineered specifically for university students, hackathon squads, and project teams.

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, ArrowLeft, Lock, Mail, User, School,
  Sparkles, Users, Video, ShieldCheck, MailCheck, AlertCircle,
  GraduationCap, Check, ArrowRight, CheckCircle2, ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  // University Autocomplete State
  const [uniSearch, setUniSearch] = useState('');
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Waiting for email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accept_terms: false,
      university: '',
    },
  });

  const firstNameVal = watch('first_name') || '';
  const lastNameVal  = watch('last_name')  || '';
  const universityVal = watch('university') || '';
  const emailVal     = watch('email')      || '';
  const passwordVal  = watch('password')   || '';

  // Close university dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target as Node)) {
        setIsUniDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter universities based on search
  const filteredUniversities = useMemo(() => {
    if (!uniSearch) return BANGLADESH_UNIVERSITIES.slice(0, 8);
    const q = uniSearch.toLowerCase();
    return BANGLADESH_UNIVERSITIES.filter((u) => u.toLowerCase().includes(q)).slice(0, 8);
  }, [uniSearch]);

  // Dynamic Password Criteria Evaluation (WorkOS-Style)
  const passwordCriteria = useMemo(() => {
    return {
      length: passwordVal.length >= 8,
      hasUpper: /[A-Z]/.test(passwordVal),
      hasNumber: /[0-9]/.test(passwordVal),
      hasSpecial: /[^A-Za-z0-9]/.test(passwordVal),
    };
  }, [passwordVal]);

  const strengthScore = useMemo(() => {
    if (!passwordVal) return 0;
    let s = 0;
    if (passwordVal.length >= 6) s += 1;
    if (passwordCriteria.length) s += 1;
    if (passwordCriteria.hasUpper) s += 1;
    if (passwordCriteria.hasNumber || passwordCriteria.hasSpecial) s += 1;
    return s;
  }, [passwordVal, passwordCriteria]);

  const strengthColor = useMemo(() => {
    switch (strengthScore) {
      case 1: return 'bg-rose-500';
      case 2: return 'bg-amber-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-emerald-500';
      default: return 'bg-white/10';
    }
  }, [strengthScore]);

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
    try {
      const res = await api.auth.register({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        university: data.university,
      });

      if (res.error) {
        setServerError(res.error);
        return;
      }

      setRegisteredEmail(data.email);
      setVerificationPending(true);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to create student account.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setResendMsg('');
      const res = await api.auth.resendVerification(registeredEmail);
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

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500/20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header */}
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
          <span className="font-extrabold text-base tracking-tight text-white">
            Project<span className="text-amber-400">Hive</span>
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex w-full max-w-6xl mx-auto items-center justify-center p-4 sm:p-6 lg:p-8 py-8 sm:py-12 relative z-10">

        {/* ── State 1: Verification Pending Screen (When registered) ── */}
        {verificationPending ? (
          <div className="w-full max-w-lg bg-[#0d1117]/95 border border-white/[0.1] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="amber" size="sm" dot>VERIFICATION DISPATCHED</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Check your university inbox
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                We sent a secure activation link to:
              </p>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-amber-300 font-bold inline-block">
                {registeredEmail}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Click the link inside the email to activate your account and access your squads, project wikis, and LiveKit meetings.
            </p>

            <div className="pt-2 space-y-3">
              <Button
                type="button"
                variant="glow"
                size="lg"
                onClick={() => router.push('/login')}
                className="w-full font-bold h-11 text-slate-950"
              >
                Continue to Sign In →
              </Button>

              <div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
                >
                  {isResending ? 'Dispatching link…' : resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Didn’t receive the email? Resend link'}
                </button>
                {resendMsg && <p className="text-[11px] text-emerald-400 mt-1">{resendMsg}</p>}
              </div>
            </div>
          </div>
        ) : (

          /* ── State 2: Main Sign Up Split Grid ── */
          <div className="w-full grid lg:grid-cols-12 gap-8 items-stretch bg-[#0d1117]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">

            {/* Left Column: 3D Collaboration Mesh & Dynamic Live Student Card */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0a0e17] to-[#07090e] border border-amber-500/20 min-h-[680px] relative overflow-hidden shadow-2xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-2 shadow-inner">
                      <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">ProjectHive Network</span>
                      <span className="text-[10px] text-amber-400/90 font-mono">NEURAL SQUAD v2.5</span>
                    </div>
                  </div>
                  <Badge variant="amber" size="sm" dot>COLLABORATION MESH</Badge>
                </div>

                {/* Interactive 3D Collaboration Mesh Canvas */}
                <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-black/50 border border-amber-500/25 shadow-inner flex items-center justify-center">
                  <Auth3DCanvas mode="signup" className="w-full h-full" />
                  <div className="absolute bottom-2 left-3 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Neural Student Nodes • Orbit with pointer</span>
                  </div>
                </div>

                {/* Real-Time Student Identity Card Preview */}
                <div className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/[0.08] shadow-lg space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      STUDENT PASS PREVIEW
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      NEW MEMBER
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shrink-0">
                      {getInitials(`${firstNameVal} ${lastNameVal}`) || 'PH'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {firstNameVal || lastNameVal ? `${firstNameVal} ${lastNameVal}`.trim() : 'Your Student Name'}
                      </h4>
                      <p className="text-xs text-amber-400/90 truncate flex items-center gap-1">
                        <School className="w-3 h-3 shrink-0" />
                        <span>{universityVal || 'Your University / Campus'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Discover cross-disciplinary student teammates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Zero-latency WebRTC meetings with collaborative whiteboards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Direct GitHub repository file tree & commit inspection</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
                <span>Free for university students & researchers</span>
                <span className="font-semibold text-amber-400">Academic License</span>
              </div>
            </div>

            {/* Right Column: WorkOS/Clerk-Inspired Registration Form */}
            <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-xl mx-auto w-full">

              {/* Segmented Quick Switch */}
              <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl mb-6 border border-white/[0.08] text-center text-xs font-semibold">
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
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Join ProjectHive
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Build projects, find teammates, and collaborate with your university community.
                </p>
              </div>

              {/* Google OAuth Quick Sign-Up */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleGoogleSignUp}
                isLoading={isGoogleLoading}
                className="w-full mb-5 font-semibold h-11 bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white"
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
                Sign up with Google Workspace
              </Button>

              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-white/[0.08] w-full" />
                <span className="bg-[#0d1117] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
                  or register with student email
                </span>
                <div className="border-t border-white/[0.08] w-full" />
              </div>

              {serverError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <p>{serverError}</p>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">First Name</label>
                    <Input
                      {...register('first_name')}
                      placeholder="Rahim"
                      error={errors.first_name?.message}
                      leftIcon={<User className="w-4 h-4 text-slate-400" />}
                      className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Last Name</label>
                    <Input
                      {...register('last_name')}
                      placeholder="Chowdhury"
                      error={errors.last_name?.message}
                      leftIcon={<User className="w-4 h-4 text-slate-400" />}
                      className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* University Autocomplete Field */}
                <div className="space-y-1.5 relative" ref={uniDropdownRef}>
                  <label className="block text-xs font-semibold text-slate-300">
                    University / Institution
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search or select your university…"
                      value={uniSearch || universityVal}
                      onChange={(e) => {
                        setUniSearch(e.target.value);
                        setValue('university', e.target.value, { shouldValidate: true });
                        setIsUniDropdownOpen(true);
                      }}
                      onFocus={() => setIsUniDropdownOpen(true)}
                      error={errors.university?.message}
                      leftIcon={<School className="w-4 h-4 text-slate-400" />}
                      rightIcon={<ChevronDown className="w-4 h-4 text-slate-400" />}
                      className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                    />
                  </div>

                  {isUniDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0f141c] border border-white/15 rounded-2xl shadow-2xl p-1 max-h-56 overflow-y-auto space-y-0.5">
                      {filteredUniversities.length > 0 ? (
                        filteredUniversities.map((uni, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setValue('university', uni, { shouldValidate: true });
                              setUniSearch('');
                              setIsUniDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/15 hover:text-amber-400 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate">{uni}</span>
                            {universityVal === uni && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-400">
                          Press enter to use custom institution name
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Student Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Student Email Address
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="student@university.edu"
                    error={errors.email?.message}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck={false}
                    className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      error={errors.password?.message}
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                      }
                      className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Confirm Password</label>
                    <Input
                      {...register('confirm_password')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      error={errors.confirm_password?.message}
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                      }
                      className="h-11 bg-white/[0.03] border-white/10 focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Dynamic Password Strength Visualizer */}
                {passwordVal && (
                  <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password Strength</span>
                      <span className="font-bold text-slate-200">
                        {strengthScore === 4 ? 'Strong' : strengthScore >= 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={cn(
                            'rounded-full transition-colors duration-300',
                            strengthScore >= step ? strengthColor : 'bg-white/10'
                          )}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-400">
                      <div className={cn('flex items-center gap-1', passwordCriteria.length ? 'text-emerald-400' : 'text-slate-500')}>
                        <Check className="w-3 h-3" /> 8+ Characters
                      </div>
                      <div className={cn('flex items-center gap-1', passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-500')}>
                        <Check className="w-3 h-3" /> Uppercase Letter
                      </div>
                      <div className={cn('flex items-center gap-1', passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500')}>
                        <Check className="w-3 h-3" /> Number
                      </div>
                      <div className={cn('flex items-center gap-1', passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500')}>
                        <Check className="w-3 h-3" /> Special Symbol
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms of Service & Privacy Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('accept_terms')}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/20 cursor-pointer accent-amber-500"
                    />
                    <span className="text-xs text-slate-400 leading-relaxed">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('terms')}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        Terms of Service
                      </button>{' '}
                      and acknowledge the{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('privacy')}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {errors.accept_terms && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.accept_terms.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full font-bold h-11 text-slate-950 shadow-lg shadow-amber-500/15"
                  >
                    {isSubmitting ? 'Creating Workspace Account…' : 'Create Student Account'}
                  </Button>
                </div>
              </form>

              {/* Bottom Quick Switch */}
              <div className="mt-8 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400">
                <span>Already have an account? </span>
                <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                  Sign in here →
                </Link>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Legal Modals */}
      <LegalModal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        type={legalModal}
      />
    </div>
  );
}
