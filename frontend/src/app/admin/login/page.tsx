'use client';
// ─── Executive Admin Login Portal (Ultra-Polished Edition) ─────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft,
  Smartphone, Lock, Mail, Server, Activity, Database, KeyRound
} from 'lucide-react';
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
    <div className="min-h-screen w-full flex flex-col bg-[#0b0f17] text-slate-100 selection:bg-amber-500/30 relative overflow-hidden font-sans">
      {/* ─── Ambient Glow & Grid Backdrop ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* ─── Mobile Device Restriction Screen (Phone Block) ─────────────────── */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/5">
          <Smartphone className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">Desktop Workstation Required</h2>
        <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">
          For institutional security compliance and granular audit controls, the Admin Console must be accessed from an authorized desktop workstation.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          Return to ProjectHive
        </Link>
      </div>

      {/* ─── Desktop Admin Portal ────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 z-10">
        {/* Top Header */}
        <header className="w-full px-8 py-4 border-b border-white/10 bg-[#0b0f17]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">ProjectHive</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </Link>
        </header>

        {/* Center Screen Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Security Briefing & Authority Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  Institutional Clearance
                </div>

                <div>
                  <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-snug">
                    Master Command & Governance Portal
                  </h1>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Access real-time platform telemetry, manage campus squads, monitor student showcase submissions, and enforce platform integrity.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {[
                    { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Protected by JWT & cryptographically signed sessions' },
                    { icon: Activity, title: 'Live Health Telemetry', desc: 'Real-time database, edge storage, & AI model stats' },
                    { icon: Database, title: 'Database Oversight', desc: 'Direct administrative control over 40+ campus members' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{item.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status pill at bottom */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Supabase & Backend: <strong className="text-slate-200 font-semibold">Healthy</strong>
                </span>
                <span className="font-mono text-slate-500">v2.4.0</span>
              </div>
            </motion.div>

            {/* Right Column: High-Tech Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-7 bg-[#111827]/90 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Back to student login</span>
                  </Link>

                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    Secured SSL
                  </span>
                </div>

                <div className="text-center space-y-2 mt-6 mb-8">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner shadow-amber-500/10">
                      <KeyRound className="w-8 h-8" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Admin Console</h2>
                  <p className="text-xs text-slate-400">Enter institutional credentials to access administrator controls</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Administrative Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="admin@projecthive.edu"
                        className={cn(
                          'w-full h-12 text-sm bg-slate-900/90 text-white rounded-xl pl-11 pr-4 border transition-all duration-200',
                          'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500',
                          errors.email ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 hover:border-white/20'
                        )}
                      />
                    </div>
                    {errors.email && <p className="text-xs font-medium text-rose-400 mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Master Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className={cn(
                          'w-full h-12 text-sm bg-slate-900/90 text-white rounded-xl pl-11 pr-12 border transition-all duration-200',
                          'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500',
                          errors.password ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 hover:border-white/20'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs font-medium text-rose-400 mt-1">{errors.password.message}</p>}
                  </div>

                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{serverError}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl text-slate-950 font-bold text-sm tracking-wide',
                      'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20',
                      'disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Verifying Institutional Clearance…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        <span>Enter Admin Console</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Card Footer Security Assurance */}
              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <p className="text-[11px] text-slate-500">
                  🔒 Encrypted with 256-bit TLS. All logins are audited with device fingerprinting.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
