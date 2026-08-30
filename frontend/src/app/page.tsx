'use client';
// ─── ProjectHive — Landing & Welcome Page ──────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Sparkles, MessageSquare, FolderKanban, ShieldCheck,
  ArrowRight, CheckCircle2, ChevronRight, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2 animate-bounce">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain rounded-xl" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Entering ProjectHive…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ─── Navigation Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1 overflow-hidden shadow-xs">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain rounded-lg" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">ProjectHive</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-20 lg:py-28 max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" /> Empowering University Student Innovators 🐝
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl"
        >
          Discover Teammates. Build Together.{' '}
          <span className="text-gradient">Ship Real Projects.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          The all-in-one collaboration hub for students. Form hackathon squads, brainstorm with Groq & Gemini AI, and showcase your capstone projects to the world.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-card border border-border font-semibold text-sm hover:bg-accent transition-all active:scale-95"
          >
            Explore Dashboard
          </Link>
        </motion.div>
      </section>

      {/* ─── Highlights Grid ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 py-16 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: 'Team Discovery',
              desc: 'Find collaborators matching your exact required technical skills and university.',
              color: 'text-violet-500 bg-violet-500/10',
            },
            {
              icon: MessageSquare,
              title: 'Real-Time Chat & Calls',
              desc: 'Socket.IO instant messaging, voice notes, and 1-on-1 WebRTC video calls.',
              color: 'text-blue-500 bg-blue-500/10',
            },
            {
              icon: Sparkles,
              title: 'AI Project Studio',
              desc: 'Generate complete, structured project ideas and timelines using Groq & Gemini.',
              color: 'text-amber-500 bg-amber-500/10',
            },
            {
              icon: FolderKanban,
              title: 'Project Showcase',
              desc: 'Showcase your portfolio, receive peer reactions, and share live demos.',
              color: 'text-emerald-500 bg-emerald-500/10',
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3 card-hover shadow-xs">
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-1 shadow-inner`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-auto px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ProjectHive" className="w-5 h-5 object-contain" />
          <span>© 2025 ProjectHive — Open Source Student Platform</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="hover:underline">Login</Link>
          <Link href="/register" className="hover:underline">Register</Link>
          <Link href="/admin/login" className="hover:underline">Admin Console</Link>
        </div>
      </footer>
    </div>
  );
}
