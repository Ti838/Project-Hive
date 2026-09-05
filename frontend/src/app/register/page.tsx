'use client';
// ─── ProjectHive — Modern Register Page ───────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, ArrowLeft, Lock, Mail,
  User, School, Sparkles, Users, Video, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BANGLADESH_UNIVERSITIES } from '@/lib/universities';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:      z.string().email('Please enter a valid university email address'),
  university: z.string().min(2, 'University name is required'),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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
    setSuccessMsg('');
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

    setSuccessMsg('Account created successfully! Redirecting to login…');
    setTimeout(() => {
      router.push('/login');
    }, 1800);
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
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 min-h-[560px]">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center p-3 shadow-inner">
                <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight">Join ProjectHive</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Join thousands of student developers, designers, and innovators building the next generation of software.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  {
                    title: 'Form Hackathon Squads',
                    desc: 'Match with peers by university, field of study, and technical stacks.',
                    icon: Users,
                  },
                  {
                    title: 'Live Audio/Video Calling',
                    desc: 'Connect in real-time with low-latency WebRTC and in-call whiteboard.',
                    icon: Video,
                  },
                  {
                    title: 'AI Project Studio',
                    desc: 'Brainstorm ideas, architecture, and task timelines with Gemini & Groq.',
                    icon: Sparkles,
                  },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/60 text-xs">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{f.title}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span>Free for all university students</span>
              <span className="font-semibold text-primary">Open Community</span>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 py-2 max-w-lg mx-auto w-full">
            {/* Quick Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6 border border-border/60 text-center text-xs font-semibold">
              <Link
                href="/login"
                className="py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <span className="py-2 rounded-lg bg-background text-foreground shadow-xs">Create Account</span>
            </div>

            <div className="space-y-1.5 mb-5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Create your account</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Fill in your information to get started for free</p>
            </div>

            {/* Google OAuth Quick Sign-Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-card border border-border/80 hover:bg-accent/60 text-foreground font-semibold text-sm transition-all duration-200 active:scale-[0.99] shadow-xs disabled:opacity-60 mb-5"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              )}
              <span>{isGoogleLoading ? 'Connecting to Google…' : 'Sign up with Google'}</span>
            </button>

            {/* Visual Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/60 px-3 text-muted-foreground font-medium backdrop-blur-xs">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> First Name
                  </label>
                  <input
                    {...register('first_name')}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    placeholder="Alex"
                    className={cn(
                      'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                      errors.first_name ? 'border-destructive' : 'border-border/80'
                    )}
                  />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> Last Name
                  </label>
                  <input
                    {...register('last_name')}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    placeholder="Morgan"
                    className={cn(
                      'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                      errors.last_name ? 'border-destructive' : 'border-border/80'
                    )}
                  />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>

              {/* University */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-muted-foreground" /> University / Institution (UGC Approved)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Select or Type</span>
                </div>
                <div className="relative">
                  <input
                    {...register('university')}
                    list="ugc-universities"
                    autoCapitalize="words"
                    autoComplete="off"
                    placeholder="Search university (e.g. DU, BUET, NSU, BRACU, SUST...)"
                    className={cn(
                      'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                      errors.university ? 'border-destructive' : 'border-border/80'
                    )}
                  />
                  <datalist id="ugc-universities">
                    {BANGLADESH_UNIVERSITIES.map((uni) => (
                      <option key={uni} value={uni} />
                    ))}
                  </datalist>
                </div>
                {errors.university && <p className="text-xs text-destructive">{errors.university.message}</p>}

                {/* Popular UGC University Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Popular:</span>
                  {[
                    'University of Dhaka (DU)',
                    'BUET',
                    'North South University (NSU)',
                    'BRAC University (BRACU)',
                    'IUB',
                    'AIUB',
                    'AUST',
                    'SUST',
                    'UIU',
                    'EWU',
                    'DIU',
                    'KUET',
                    'RUET',
                    'CUET'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const match = BANGLADESH_UNIVERSITIES.find((u) => u.toLowerCase().includes(chip.toLowerCase())) || chip;
                        setValue('university', match, { shouldValidate: true });
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
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

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
                      className={cn(
                        'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 pr-10 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                        errors.password ? 'border-destructive' : 'border-border/80'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Confirm Password
                  </label>
                  <input
                    {...register('confirm_password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className={cn(
                      'w-full h-11 text-sm bg-muted/60 rounded-xl px-3.5 border focus:outline-none focus:border-primary focus:bg-background transition-all',
                      errors.confirm_password ? 'border-destructive' : 'border-border/80'
                    )}
                  />
                  {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {serverError}
                </div>
              )}

              {/* Success message */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-md mt-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-border/60 text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
