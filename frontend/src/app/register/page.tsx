'use client';
// ─── Register Page ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:      z.string().email('Enter a valid university email address'),
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
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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
    }, 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-primary p-12 text-primary-foreground">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-primary-foreground/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto p-3 shadow-inner">
            <img src="/bee-logo.png" alt="ProjectHive" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-bold">Join ProjectHive 🐝</h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            The all-in-one collaboration hub for students. Find teams, build incredible projects, and expand your network.
          </p>
          <div className="space-y-3 pt-4 text-left bg-primary-foreground/10 p-5 rounded-2xl">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span>Connect with passionate student developers</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span>Real-time voice, video & messaging</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span>AI-powered project idea brainstorming</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center p-1.5">
              <img src="/bee-logo.png" alt="ProjectHive" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-bold text-xl">ProjectHive</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="text-muted-foreground mt-1 text-sm">Join thousands of students building the future</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">First Name</label>
                <input
                  {...register('first_name')}
                  placeholder="Alex"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-primary transition-colors',
                    errors.first_name ? 'border-destructive' : 'border-transparent'
                  )}
                />
                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Last Name</label>
                <input
                  {...register('last_name')}
                  placeholder="Morgan"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-primary transition-colors',
                    errors.last_name ? 'border-destructive' : 'border-transparent'
                  )}
                />
                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">University / Institution</label>
              <input
                {...register('university')}
                placeholder="e.g. University of Dhaka"
                className={cn(
                  'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-primary transition-colors',
                  errors.university ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.university && <p className="text-xs text-destructive">{errors.university.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@university.edu"
                className={cn(
                  'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-primary transition-colors',
                  errors.email ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className={cn(
                    'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 pr-10 border focus:outline-none focus:border-primary transition-colors',
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

            <div className="space-y-1">
              <label className="text-xs font-medium">Confirm Password</label>
              <input
                {...register('confirm_password')}
                type="password"
                placeholder="Re-enter password"
                className={cn(
                  'w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-primary transition-colors',
                  errors.confirm_password ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
            </div>

            {serverError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {serverError}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

