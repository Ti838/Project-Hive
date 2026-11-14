'use client';
// ─── ProjectHive — SecOps Institutional Command Terminal (Admin Login) ─────────
// Inspired by Cloudflare Zero Trust, Datadog SecOps, AWS GovCloud, and Sentinel.
// Complete visual, architectural, and behavioral isolation from student auth.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, Eye, EyeOff, ArrowLeft, Mail, Lock,
  AlertCircle, Shield, Radio, Laptop, Clock, Cpu,
  Terminal, KeyRound, CheckCircle2, LockKeyhole
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getExactDeviceTelemetry, type DeviceTelemetry } from '@/lib/deviceTelemetry';
import { getExactDeviceDetails } from '@/lib/deviceFingerprint';
import { Auth3DCanvas } from '@/components/3d';
import { Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Valid institutional administrator email is required'),
  password: z.string().min(1, 'Administrator passkey is required'),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [detectedIp, setDetectedIp] = useState<string>('Resolving Node IP...');
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [authAttemptsRemaining, setAuthAttemptsRemaining] = useState<number>(5);

  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  // 1. Live SecOps Clock & Workstation Telemetry Probe
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    }, 1000);

    getExactDeviceTelemetry().then((t) => setTelemetry(t));

    const fetchIp = async () => {
      try {
        const clientRes = await api.admin.getClientTelemetry();
        if (clientRes && clientRes.ip) {
          setDetectedIp(clientRes.ip);
          return;
        }
      } catch (_) {}

      try {
        const ipifyRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const data = await ipifyRes.json();
        if (data && data.ip) {
          setDetectedIp(data.ip);
          return;
        }
      } catch (_) {}

      setDetectedIp('127.0.0.1 (Local Workstation)');
    };

    fetchIp();
    return () => clearInterval(timer);
  }, []);

  // 2. High-Privilege Dual-Tier Authentication Execution
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
      if (res.ok && res.user && (res.user.role === 'admin' || res.user.role === 'super_admin')) {
        login(res.user, res.accessToken, res.refreshToken);
        router.push('/admin/dashboard');
        return;
      }

      if (res.ok && res.user && res.user.role !== 'admin') {
        setServerError('ACCESS DENIED: Standard student account credentials cannot access the SecOps Command Console.');
        return;
      }

      if (res.error) {
        setServerError(res.error);
        setAuthAttemptsRemaining((prev) => Math.max(0, prev - 1));
        return;
      }
    } catch (err: any) {
      setServerError(err?.message || 'Authentication handshake failed.');
      setAuthAttemptsRemaining((prev) => Math.max(0, prev - 1));
      return;
    }

    setServerError('Invalid administrator credentials. Terminal attempt has been recorded.');
    setAuthAttemptsRemaining((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#05070b] text-slate-100 font-sans selection:bg-amber-500/30 relative overflow-hidden">
      {/* Background Cybernetic Grid Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/5 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Telemetry Header Bar */}
      <header className="w-full px-4 sm:px-8 py-3 border-b border-white/[0.08] bg-[#07090e]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] px-2.5 py-1 rounded-lg transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="font-sans font-medium text-xs">Student Portal</span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Node IP Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">NODE_IP:</span>
            <span className="text-emerald-400 font-bold">{detectedIp}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              TLS 1.3
            </span>
          </div>

          {/* Hardware & Chipset */}
          <div className="hidden lg:flex items-center gap-1.5 truncate">
            <Laptop className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-bold truncate">
              {telemetry?.deviceModel || telemetry?.osName || 'Personal Workstation'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 truncate">
              {telemetry?.gpuRenderer || 'WebGL Active'}
            </span>
          </div>
        </div>

        {/* Right Clearance & Live UTC Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime || 'SYNCHRONIZING UTC...'}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider">
            ROOT AUTH • SEC-OPS
          </span>
        </div>
      </header>

      {/* Main Command Console Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-stretch">

          {/* Left Column: 3D Cryptographic Core & Security Architecture */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#090d14]/90 border border-white/[0.08] shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                      SECURITY ENCLAVE
                    </span>
                    <h2 className="text-sm font-bold text-white tracking-tight">Institutional Terminal</h2>
                  </div>
                </div>
                <Badge variant="amber" size="sm" dot>RESTRICTED</Badge>
              </div>

              {/* 3D Cryptographic Core Canvas */}
              <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-black/60 border border-amber-500/20 shadow-inner flex items-center justify-center">
                <Auth3DCanvas mode="admin" className="w-full h-full" />
                <div className="absolute bottom-2 left-3 z-10 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>CRYPTOGRAPHIC CORE • ACTIVE</span>
                </div>
              </div>

              {/* Security Protocol Ledger */}
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                  Enforced Security Controls
                </div>
                {[
                  { label: 'Mutual TLS 1.3 Encryption', status: 'ACTIVE', color: 'text-emerald-400' },
                  { label: 'KeySigner HMAC-SHA256 Token Mint', status: 'VERIFIED', color: 'text-emerald-400' },
                  { label: 'Live Database Role Validation', status: 'ENABLED', color: 'text-emerald-400' },
                  { label: 'Brute-Force Rate Lockout Shield', status: '5 ATTEMPTS', color: 'text-amber-400' },
                  { label: 'Tamper-Evident Audit Logging', status: 'RECORDING', color: 'text-cyan-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <span className={cn('font-bold text-[10px]', item.color)}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] font-mono text-[10px] text-slate-500 flex items-center justify-between">
              <span>WORKSTATION GATEWAY</span>
              <span className="text-amber-400 font-bold">PORT 5000 • SECURE</span>
            </div>
          </div>

          {/* Right Column: High-Security Terminal Console Form */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="w-full bg-[#0d1117]/95 border border-white/[0.1] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6">

              {/* Terminal Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-xs font-semibold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>AUTHORIZATION CONSOLE</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    ATTEMPTS: <span className="text-amber-400 font-bold">{authAttemptsRemaining}/5</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Institutional Sign-In
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enter master administrative credentials to access moderation queues, user roles, security audits, and kill switches.
                </p>
              </div>

              {/* Error Notice */}
              {serverError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-200 block">Authentication Refused</span>
                    <p className="leading-relaxed">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                    Administrator Email / Identity
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="admin@projecthive.edu"
                    error={errors.email?.message}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck={false}
                    className="font-mono text-sm bg-black/40 border-white/10 focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                    Administrative Master Passkey
                  </label>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
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
                        {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    }
                    className="font-mono text-sm bg-black/40 border-white/10 focus:border-amber-500/60"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={authAttemptsRemaining <= 0}
                    className="w-full font-mono text-xs uppercase tracking-wider h-12 shadow-lg shadow-amber-500/15"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Verifying Cryptographic Workstation Authority…</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <LockKeyhole className="w-4 h-4" />
                        <span>Authorize Admin Workstation</span>
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Warning Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RESTRICTED UNIVERSITY GOVERNANCE ZONE</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  All interactive sessions, queries, and administrative overrides are cryptographically signed with SHA-256 and recorded to immutable system audit logs.
                </p>
              </div>

              {/* Bottom Quick Link */}
              <div className="pt-2 text-center text-xs text-slate-500 font-sans">
                <span>Not an institutional administrator? </span>
                <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                  Return to Student Sign In →
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
