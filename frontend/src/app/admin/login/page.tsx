'use client';
// ─── Admin Login Portal ────────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

import { getExactDeviceDetails } from '@/lib/deviceFingerprint';

const schema = z.object({
  email: z.string().email('Valid admin email is required'),
  password: z.string().min(1, 'Admin password is required'),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setServerError('');
    const deviceMeta = await getExactDeviceDetails();

    // 1. Try standard DB admin login first
    const res = await api.auth.login(data.email, data.password, deviceMeta);
    if (res.ok && res.user && res.user.role === 'admin') {
      login(res.user, res.accessToken, res.refreshToken);
      router.push('/admin/dashboard');
      return;
    }

    // 2. If DB login failed or not an admin, attempt Root Super-Admin (.env credentials)
    const superRes = await api.admin.superAdminLogin(data.email, data.password);
    const adminUser = (superRes as any)?.user || (superRes as any)?.admin;
    const adminToken = (superRes as any)?.token || (superRes as any)?.accessToken;
    if (superRes.ok && adminToken && adminUser) {
      login(adminUser, adminToken, adminToken);
      router.push('/admin/dashboard');
      return;
    }

    // 3. Both failed - report clean error
    setServerError(
      res.user?.role !== 'admin' && res.ok
        ? 'Access denied. This account does not possess administrative privileges.'
        : (superRes.error || res.error || 'Invalid administrative credentials')
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      {/* Top Header */}
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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to user sign in
          </Link>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-xs text-muted-foreground">Authorized University Administrators & Moderators Only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="admin@projecthive.edu"
              className={cn(
                'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-amber-500 transition-colors',
                errors.email ? 'border-destructive' : 'border-transparent'
              )}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 pr-12 border focus:outline-none focus:border-amber-500 transition-colors',
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

          {serverError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 tap-press transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isSubmitting ? 'Verifying Credentials…' : 'Enter Admin Console'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}


