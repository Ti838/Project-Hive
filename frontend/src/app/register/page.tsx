'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  User,
  School,
  Sparkles,
  Users,
  Video,
  ShieldCheck,
  MailCheck,
  AlertCircle,
  GraduationCap,
  Check,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { BANGLADESH_UNIVERSITIES } from '@/lib/universities';
import { LegalModal } from '@/components/legal/LegalModal';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid university or personal email'),
  university: z.string().min(2, 'University or institution name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service to proceed',
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accept_terms: false,
      university: '',
    },
  });

  const firstNameVal = watch('first_name') || '';
  const lastNameVal = watch('last_name') || '';
  const universityVal = watch('university') || '';
  const emailVal = watch('email') || '';
  const passwordVal = watch('password') || '';

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

  // Dynamic Password Criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: passwordVal.length >= 8,
      hasUpper: /[A-Z]/.test(passwordVal),
      hasNumber: /[0-9]/.test(passwordVal),
      hasSpecial: /[^A-Za-z0-9]/.test(passwordVal),
    };
  }, [passwordVal]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.hasUpper) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  }, [passwordCriteria]);

  const detectedUniversity = useMemo(() => {
    const lower = emailVal.toLowerCase();
    if (lower.includes('buet.ac.bd')) return 'BUET Verified Student';
    if (lower.includes('du.ac.bd')) return 'Dhaka University Verified';
    if (lower.includes('bracu.ac.bd')) return 'BRAC University Verified';
    if (lower.includes('northsouth.edu') || lower.includes('nsu.edu')) return 'NSU Verified Student';
    if (lower.includes('sust.edu')) return 'SUST Verified Student';
    if (lower.includes('iut-dhaka.edu')) return 'IUT Verified Student';
    if (lower.includes('.edu') || lower.includes('.ac.bd')) return 'Recognized Academic Domain';
    return null;
  }, [emailVal]);

  const handleGoogleSignUp = async () => {
    try {
      setServerError('');
      setIsGoogleLoading(true);
      const res = await api.auth.googleInitiate();
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setServerError(res.error || 'Failed to connect to Google Sign-In.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setServerError(err?.message || 'Unexpected error during Google Sign-In.');
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
        university: data.university,
        password: data.password,
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
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center p-1.5 shadow-inner">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            Project<span className="text-primary">Hive</span>
          </span>
        </Link>
      </header>

      {/* ── Main Registration Layout ─────────────────────────────────── */}
      <main className="flex-1 flex w-full max-w-6xl mx-auto items-center justify-center p-4 sm:p-6 lg:p-8 my-6">
        
        {/* Verification Pending Screen */}
        {verificationPending ? (
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto text-primary shadow-inner">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-semibold">
                Verification Dispatched
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Check your university inbox
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                We sent a secure activation link to:
              </p>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-xs font-mono text-primary font-bold inline-block">
                {registeredEmail}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the link inside the email to activate your account and join your squads, project wikis, and LiveKit meetings.
            </p>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 glow-primary"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
                >
                  {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Didn’t receive the email? Resend link'}
                </button>
                {resendMsg && <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-1">{resendMsg}</p>}
              </div>
            </div>
          </div>
        ) : (
          /* Main Sign Up Card Grid */
          <div className="w-full grid lg:grid-cols-12 gap-8 items-stretch bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
            
            {/* Left Brand & Student Pass Preview Panel (Desktop Only) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-background border border-primary/20 relative overflow-hidden">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center p-2 shadow-inner">
                      <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">ProjectHive Network</span>
                      <span className="text-[10px] text-primary font-mono">CAMPUS MESH</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-semibold">
                    Free Student Tier
                  </span>
                </div>

                {/* Real-Time Live Student Identity Card Pass */}
                <div className="p-5 rounded-2xl bg-muted/40 border border-primary/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      Student Identity Pass
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      NEW MEMBER
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center font-bold text-primary-foreground text-base shadow-md shrink-0">
                      {getInitials(`${firstNameVal} ${lastNameVal}`) || 'PH'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {firstNameVal || lastNameVal ? `${firstNameVal} ${lastNameVal}`.trim() : 'Your Student Name'}
                      </h4>
                      <p className="text-xs text-primary/90 truncate flex items-center gap-1 mt-0.5">
                        <School className="w-3.5 h-3.5 shrink-0" />
                        <span>{universityVal || 'Your University / Campus'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>ID: VERIFIED-ACADEMIC</span>
                    <span className="text-emerald-500 dark:text-emerald-400">STATUS: ACTIVE</span>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="space-y-2.5 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Recruit teammates from 50+ Bangladesh campuses</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>LiveKit SFU 4K video rooms with screen sharing</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Free Groq & Gemini Flash AI project copilot</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>PostgreSQL Row-Level Security for capstone code</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>Free forever for students</span>
                <span className="text-primary font-semibold">ProjectHive 2.0</span>
              </div>
            </div>

            {/* Right Form Container */}
            <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-lg mx-auto w-full">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Create Your Account</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Join ProjectHive to find your squad, build your capstone, and ship your future.
                </p>
              </div>

              {/* Google Workspace Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full h-11 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-xs mb-5 cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Sign up with Google Workspace</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-full border-t border-border" />
                <span className="absolute px-3 bg-card text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  or register with email
                </span>
              </div>

              {/* Error Notice */}
              {serverError && (
                <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2.5 text-xs text-destructive animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                  <span className="leading-relaxed">{serverError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* First and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rahim"
                        {...register('first_name')}
                        className={`w-full h-10 pl-10 pr-3 bg-muted/40 border ${
                          errors.first_name ? 'border-destructive' : 'border-input focus:border-primary'
                        } rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                      />
                    </div>
                    {errors.first_name && <p className="mt-1 text-[11px] text-destructive">{errors.first_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="Chowdhury"
                      {...register('last_name')}
                      className={`w-full h-10 px-3 bg-muted/40 border ${
                        errors.last_name ? 'border-destructive' : 'border-input focus:border-primary'
                      } rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                    />
                    {errors.last_name && <p className="mt-1 text-[11px] text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>

                {/* University Searchable Dropdown */}
                <div ref={uniDropdownRef} className="relative">
                  <label className="block text-xs font-semibold text-foreground mb-1">University / Institution</label>
                  <div
                    onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
                    className={`w-full h-10 px-3 bg-muted/40 border ${
                      errors.university ? 'border-destructive' : 'border-input hover:border-border'
                    } rounded-xl flex items-center justify-between text-xs sm:text-sm text-foreground cursor-pointer transition-all`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <School className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className={universityVal ? 'text-foreground truncate' : 'text-muted-foreground'}>
                        {universityVal || 'Search or select your university...'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>

                  {isUniDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-card border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <input
                        type="text"
                        placeholder="Type university name (e.g. BUET, DU, BRAC)..."
                        value={uniSearch}
                        onChange={(e) => setUniSearch(e.target.value)}
                        className="w-full h-9 px-3 mb-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredUniversities.map((uni) => (
                          <div
                            key={uni}
                            onClick={() => {
                              setValue('university', uni, { shouldValidate: true });
                              setIsUniDropdownOpen(false);
                              setUniSearch('');
                            }}
                            className="px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 cursor-pointer flex items-center justify-between"
                          >
                            <span className="truncate">{uni}</span>
                            {universityVal === uni && <Check className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.university && <p className="mt-1 text-[11px] text-destructive">{errors.university.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">University or Student Email</label>
                    {detectedUniversity && (
                      <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {detectedUniversity}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      placeholder="student@university.ac.bd"
                      {...register('email')}
                      className={`w-full h-10 pl-10 pr-3 bg-muted/40 border ${
                        errors.email ? 'border-destructive' : 'border-input focus:border-primary'
                      } rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-[11px] text-destructive">{errors.email.message}</p>}
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        {...register('password')}
                        className={`w-full h-10 pl-10 pr-9 bg-muted/40 border ${
                          errors.password ? 'border-destructive' : 'border-input focus:border-primary'
                        } rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        {...register('confirm_password')}
                        className={`w-full h-10 pl-10 pr-9 bg-muted/40 border ${
                          errors.confirm_password ? 'border-destructive' : 'border-input focus:border-primary'
                        } rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                {(errors.password || errors.confirm_password) && (
                  <p className="text-[11px] text-destructive">
                    {errors.password?.message || errors.confirm_password?.message}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {passwordVal && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            passwordScore >= step
                              ? passwordScore <= 2
                                ? 'bg-destructive'
                                : passwordScore === 3
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Strength</span>
                      <span className={passwordScore === 4 ? 'text-emerald-500 dark:text-emerald-400 font-bold' : passwordScore >= 2 ? 'text-amber-500 dark:text-amber-400' : 'text-destructive'}>
                        {passwordScore === 4 ? 'Strong' : passwordScore >= 2 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('accept_terms')}
                      className="mt-1 rounded bg-muted/40 border-input text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs text-muted-foreground leading-normal">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('terms')}
                        className="text-primary hover:underline underline-offset-2"
                      >
                        Terms of Service
                      </button>{' '}
                      and acknowledge the{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('privacy')}
                        className="text-primary hover:underline underline-offset-2"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {errors.accept_terms && (
                    <p className="mt-1 text-[11px] text-destructive">{errors.accept_terms.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer glow-primary"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Student Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Link */}
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Legal Modal */}
      {legalModal && (
        <LegalModal isOpen={true} type={legalModal} onClose={() => setLegalModal(null)} />
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border">
        &copy; {new Date().getFullYear()} ProjectHive. The University Incubation Mesh.
      </footer>
    </div>
  );
}
