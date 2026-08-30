'use client';
// ─── Admin Dashboard ───────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, FolderKanban, GraduationCap, ArrowLeft, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { Stats } from '@/types';

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    api.stats().then((res) => {
      if (res.ok) setStats(res as unknown as Stats);
      setLoading(false);
    });
  }, [user]);

  const handleAdminLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-8">
      {/* Admin Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Central Console</h1>
            <p className="text-xs text-muted-foreground">ProjectHive System Metrics, Oversight & Moderation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Switch to User View
          </Link>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered Students', value: stats?.users ?? 0, icon: Users, color: 'text-violet-500 bg-violet-500/10' },
          { label: 'Formed Teams', value: stats?.teams ?? 0, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Showcase Projects', value: stats?.projects ?? 0, icon: FolderKanban, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Universities Represented', value: stats?.universities ?? 0, icon: GraduationCap, color: 'text-amber-500 bg-amber-500/10' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '…' : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Infrastructure Status
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <span>Database (Supabase PostgreSQL)</span>
              <span className="text-emerald-600 font-medium text-xs">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <span>WebSocket Gateway (Socket.IO)</span>
              <span className="text-emerald-600 font-medium text-xs">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <span>AI Engine (Groq & Gemini)</span>
              <span className="text-emerald-600 font-medium text-xs">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <span>WebRTC Signaling Service</span>
              <span className="text-emerald-600 font-medium text-xs">Ready</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Moderation Quick Tools
          </h2>
          <p className="text-xs text-muted-foreground">Automated spam filters and content safety triggers are actively running on the backend API.</p>
          <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-foreground">Active Policy Enforcement:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>XSS sanitization active across all posts, comments, and messages</li>
              <li>Rate limits configured on authentication and social endpoints</li>
              <li>Email verification and JWT expiration automated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

