'use client';
// ─── Login Page ────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Hexagon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
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
    const res = await api.auth.login(data.email, data.password);
    if (!res.ok || res.error) {
      setServerError(res.error ?? 'Invalid email or password');
      return;
    }
    login(res.user, res.accessToken, res.refreshToken);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-primary p-12 text-primary-foreground">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-primary-foreground/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto p-3 shadow-inner">
            <img src="/bee-logo.png" alt="ProjectHive" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-bold">ProjectHive 🐝</h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Discover teammates, collaborate in real-time, and showcase your work — all in one place.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[['🤝', 'Find Teammates'], ['💬', 'Real-time Chat'], ['🚀', 'Showcase Projects']].map(([emoji, label]) => (
              <div key={label} className="bg-primary-foreground/10 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs text-primary-foreground/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center p-1.5">
              <img src="/bee-logo.png" alt="ProjectHive" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-bold text-xl">ProjectHive</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@university.edu"
                autoComplete="email"
                className={cn(
                  'w-full text-sm bg-muted rounded-xl px-4 py-3 border focus:outline-none focus:border-primary transition-colors',
                  errors.email ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Server error */}
            {serverError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
