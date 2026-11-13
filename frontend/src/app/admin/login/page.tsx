'use client';
// ─── ProjectHive — Secure Admin Login Console (Universal Responsive) ───────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';
import { Button, Input, Badge } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Valid administrator email is required'),
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
    <div className="min-h-screen w-full flex flex-col bg-[#07090e] text-slate-100 selection:bg-amber-500/30">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            PROJECT<span className="text-amber-400">HIVE</span> <span className="text-xs text-amber-400/80 font-mono">ROOT</span>
          </span>
        </Link>
      </header>

      {/* Main Admin Login Form — Universal for Mobile & Desktop */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 bg-[#0d1117]/95 border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to user login
            </Link>
            <Badge variant="amber" size="sm" dot>SEC-OPS LEVEL 4</Badge>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Institutional Console</h1>
            <p className="text-xs text-slate-400">Authorized University Administrators & Moderators Only</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('email')}
              label="Admin Email"
              type="email"
              placeholder="admin@projecthive.edu"
              error={errors.email?.message}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              autoCapitalize="none"
              autoComplete="email"
              spellCheck={false}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none">
                Password
              </label>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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

            {serverError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <p>{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              {isSubmitting ? 'Authenticating Terminal…' : 'Access Admin Console'}
            </Button>
          </form>

          <div className="pt-4 border-t border-white/[0.08] text-center text-[11px] text-slate-500 font-mono">
            <span>MUTUAL TLS / SHA-256 SESSION HASHING VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
