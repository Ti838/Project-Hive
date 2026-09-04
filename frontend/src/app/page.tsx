'use client';
// ─── ProjectHive — Modern Student Collaboration Platform Landing Page ──────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Sparkles, MessageSquare, FolderKanban,
  ArrowRight, CheckCircle2, ChevronRight, Video, Code2,
  Share2, ShieldCheck, Zap, Layers, Globe, Star, ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { displayName, getInitials, getAvatarColor } from '@/lib/utils';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = mounted && user ? displayName(user) : '';
  const avatarColor = mounted && user?.avatar_color ? user.avatar_color : getAvatarColor(user?.id || 'guest');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 overflow-x-hidden">
      {/* ─── Navigation Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center p-2 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                ProjectHive <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">v2.0</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">Student Collaboration Platform</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#collaboration" className="hover:text-foreground transition-colors">Live Tools</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#tech-stack" className="hover:text-foreground transition-colors">Tech Stack</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/profile" className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(userName || 'User')}
                    </div>
                  )}
                  <span className="text-xs font-medium max-w-[100px] truncate">{userName || 'Account'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-primary/25 active:scale-95 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen University Collaboration & Hackathon Hub
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-5xl"
        >
          Discover Teammates.{' '}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Build Projects.
          </span>{' '}
          Ship to the World.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mt-6"
        >
          The complete platform for student developers, designers, and innovators. Form hackathon teams with skill matching, brainstorm with Groq & Gemini AI, talk live with WebRTC audio/video calls, and showcase your builds.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-8"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border/80 font-semibold text-sm sm:text-base hover:bg-accent hover:border-border transition-all active:scale-95 shadow-xs"
          >
            Explore Dashboard <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </motion.div>

        {/* Live Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl w-full text-left"
        >
          {[
            { label: 'Real-Time Calls', desc: 'WebRTC & LiveKit Voice/Video', icon: Video, color: 'text-violet-500' },
            { label: 'Smart AI Studio', desc: 'Groq & Gemini Architecture', icon: Sparkles, color: 'text-amber-500' },
            { label: 'Skill Matcher', desc: 'University & Role Filters', icon: Users, color: 'text-blue-500' },
            { label: 'Live Showcase', desc: 'Peer Reviews & Reactions', icon: FolderKanban, color: 'text-emerald-500' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/80 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted shrink-0">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{item.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Highlights & Features Section ────────────────────────────── */}
      <section id="features" className="px-4 sm:px-8 py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary">Powerful Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">Everything you need to collaborate & succeed</h3>
            <p className="text-sm sm:text-base text-muted-foreground">From initial idea brainstorming to final project release, ProjectHive keeps your entire team synchronized.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Team Discovery & Squads',
                desc: 'Filter potential teammates by tech skills (React, Node, Python, Flutter), university, and experience level. Send squad invitations with 1-click.',
                badge: 'Matchmaking',
                color: 'text-violet-500 bg-violet-500/10',
              },
              {
                icon: Video,
                title: 'HD Video, Audio & Screen Share',
                desc: 'Integrated real-time WebRTC and LiveKit rooms for instant team standups, screen-sharing code reviews, and live whiteboard brainstorming.',
                badge: 'Live Calls',
                color: 'text-blue-500 bg-blue-500/10',
              },
              {
                icon: Sparkles,
                title: 'AI Copilot & Idea Generator',
                desc: 'Harness Google Gemini & Groq LLMs to generate project roadmaps, tech stack recommendations, database schemas, and milestone plans in seconds.',
                badge: 'AI Powered',
                color: 'text-amber-500 bg-amber-500/10',
              },
              {
                icon: MessageSquare,
                title: 'Instant Messaging & Voice Notes',
                desc: 'Socket.IO powered chats with live typing indicators, direct messages, project channels, and audio voice note messaging.',
                badge: 'Real-Time',
                color: 'text-emerald-500 bg-emerald-500/10',
              },
              {
                icon: FolderKanban,
                title: 'Project Portfolio & Showcase',
                desc: 'Publish your capstone and hackathon builds with live demo links, repository badges, screenshots, and receive constructive feedback from peers.',
                badge: 'Showcase',
                color: 'text-pink-500 bg-pink-500/10',
              },
              {
                icon: ShieldCheck,
                title: 'Verified Student Network',
                desc: 'Collaborate within trusted student communities with verified university profiles, device security fingerprints, and admin audit logging.',
                badge: 'Secure',
                color: 'text-indigo-500 bg-indigo-500/10',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center shadow-inner`}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                      {f.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg">{f.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works / Workflow ──────────────────────────────────── */}
      <section id="workflow" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-bold text-primary">Simple & Fast</h2>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight">How ProjectHive Works</h3>
          <p className="text-sm text-muted-foreground">Start collaborating on your next big project in 3 simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            {
              step: '01',
              title: 'Create Your Profile',
              desc: 'Select your university, technical skill sets, and interests so teammates can easily find and connect with you.',
            },
            {
              step: '02',
              title: 'Form Squads or Brainstorm with AI',
              desc: 'Discover talented peers or use the AI Studio to generate structured project concepts, tasks, and tech stacks.',
            },
            {
              step: '03',
              title: 'Build, Call & Showcase',
              desc: 'Collaborate live with instant chat and HD calls, then showcase your completed project to the community.',
            },
          ].map((item, idx) => (
            <div key={item.step} className="p-8 rounded-2xl bg-card border border-border flex flex-col gap-4 relative overflow-hidden shadow-xs">
              <span className="text-4xl font-black text-primary/20">{item.step}</span>
              <h4 className="text-lg font-bold">{item.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack Section ───────────────────────────────────────── */}
      <section id="tech-stack" className="px-4 sm:px-8 py-16 bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Engineered with Modern Technology</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">High performance, low latency, modern stack.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
            {[
              'Next.js 15 (App Router)',
              'TypeScript',
              'Tailwind CSS',
              'Node.js & Express',
              'PostgreSQL & Supabase',
              'Socket.IO Realtime',
              'LiveKit WebRTC Calls',
              'Google Gemini 2.0 AI',
              'Groq Llama 3 AI',
              'Zustand State Engine',
            ].map((tech) => (
              <span key={tech} className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground/80 shadow-2xs">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent border border-primary/20 flex flex-col items-center gap-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center p-2.5">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">Ready to build your next big project?</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Join student creators, developers, and designers from universities worldwide. Get started today in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-accent transition-all"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-auto px-4 sm:px-8 py-8 border-t border-border bg-card/50 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ProjectHive" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-foreground">ProjectHive</span>
            <span>— Open-Source Student Collaboration Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            <Link href="/forgot-password" className="hover:text-foreground transition-colors">Forgot Password</Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">Admin Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

