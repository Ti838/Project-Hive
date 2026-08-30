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
    const res = await api.auth.login(data.email, data.password);
    if (!res.ok || res.error) {
      setServerError(res.error ?? 'Invalid administrative credentials');
      return;
    }
    if (res.user?.role !== 'admin') {
      setServerError('Access denied. This account does not possess administrative privileges.');
      return;
    }
    login(res.user, res.accessToken, res.refreshToken);
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-2xl p-8 shadow-xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to user portal
        </Link>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
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
                'w-full text-sm bg-muted rounded-xl px-4 py-3 border focus:outline-none focus:border-amber-500 transition-colors',
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
                  'w-full text-sm bg-muted rounded-xl px-4 py-3 pr-10 border focus:outline-none focus:border-amber-500 transition-colors',
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

          {serverError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isSubmitting ? 'Verifying Credentials…' : 'Enter Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}

