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

import { getExactDeviceDetails } from '@/lib/deviceFingerprint';

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
    <div className="min-h-[100dvh] w-full flex overflow-x-hidden">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-primary p-8 xl:p-12 text-primary-foreground">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-primary-foreground/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto p-3 shadow-inner">
            <img src="/logo.png" alt="ProjectHive" className="w-14 h-14 object-contain rounded-2xl" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold">ProjectHive 🐝</h1>
          <p className="text-primary-foreground/80 text-base xl:text-lg leading-relaxed">
            Discover teammates, collaborate in real-time, and showcase your work — all in one place.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[['🤝', 'Find Teams'], ['💬', 'Live Chat'], ['🚀', 'Showcase']].map(([emoji, label]) => (
              <div key={label} className="bg-primary-foreground/10 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs text-primary-foreground/70 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 md:px-12 bg-background min-h-[100dvh]">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center p-2 overflow-hidden">
              <img src="/logo.png" alt="ProjectHive" className="w-6 h-6 object-contain rounded-lg" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProjectHive</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">Email</label>
              <input
                {...register('email')}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@university.edu"
                className={cn(
                  'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
                  errors.email ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 pr-12 border focus:outline-none focus:border-primary transition-colors',
                    errors.password ? 'border-destructive' : 'border-transparent'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground touch-target flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              className="w-full h-12 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] tap-press transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>

  );
}
