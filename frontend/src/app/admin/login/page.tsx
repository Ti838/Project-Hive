'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';

const schema = z.object({
  email: z.string().email('Please enter a valid administrator email'),
  password: z.string().min(1, 'Administrator passkey is required'),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const { login } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setServerError('');
    const deviceMeta = await getExactDeviceDetails();

    // 1. Try Root Super-Admin (.env credentials via /api/admin/auth/login)
    try {
      const superRes = await api.admin.superAdminLogin(data.email, data.password);
      const adminUser = (superRes as any)?.user || (superRes as any)?.admin;
      const adminToken = (superRes as any)?.token || (superRes as any)?.accessToken;
      if (superRes.ok && adminToken && adminUser) {
        login(adminUser, adminToken, adminToken);
        router.push('/admin/dashboard');
        return;
      }
    } catch (_) {}

    // 2. Fallback to Database Role Admin Login (/api/auth/login with role check)
    try {
      const res = await api.auth.login(data.email, data.password, deviceMeta);
      if (res.ok && res.user && (res.user.role === 'admin' || res.user.role === 'super_admin' || res.user.role === 'moderator')) {
        login(res.user, res.accessToken, res.refreshToken);
        router.push('/admin/dashboard');
        return;
      }

      if (res.ok && res.user && res.user.role !== 'admin') {
        setServerError('Access denied: Your account does not have administrative privileges.');
        return;
      }

      setServerError(res.error || 'Invalid administrator email or passkey');
    } catch (err: any) {
      setServerError(err?.message || 'Authentication failed. Please verify credentials.');
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
          <span>Back to Student Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center p-1.5 shadow-inner">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            Project<span className="text-primary">Hive</span> <span className="text-muted-foreground font-normal">Admin</span>
          </span>
        </div>
      </header>

      {/* ── Center Login Card ────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-primary shadow-inner">
              <LockKeyhole className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Institutional Sign-In</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              Enter master administrative credentials to access moderation queues, user roles, and security audits.
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-500 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="admin@projecthive.app"
                  {...register('email')}
                  className={`w-full h-11 pl-10 pr-4 bg-muted/40 border ${
                    errors.email ? 'border-destructive' : 'border-input focus:border-primary'
                  } rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Administrative Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password')}
                  className={`w-full h-11 pl-10 pr-10 bg-muted/40 border ${
                    errors.password ? 'border-destructive' : 'border-input focus:border-primary'
                  } rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer glow-primary"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authorize Admin Workstation</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Restricted administrative area. All access attempts are recorded.</span>
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border">
        &copy; {new Date().getFullYear()} ProjectHive. All rights reserved.
      </footer>
    </div>
  );
}
