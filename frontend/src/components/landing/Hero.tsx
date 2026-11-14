'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  Video, 
  Mic, 
  MessageSquare, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Flame, 
  Rocket, 
  Play, 
  ExternalLink,
  Copy,
  Check,
  Terminal 
} from 'lucide-react';
import { Hero3DEnvironment } from '@/components/3d/Hero3DEnvironment';
import { Hive3DScene } from '@/components/3d/Hive3DScene';

export function Hero() {
  const [activeTab, setActiveTab] = useState<'3d' | 'squad' | 'calling' | 'chat'>('3d');
  const [copiedCli, setCopiedCli] = useState(false);

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      {/* ── Background Glow & Radial Ambient Lighting ────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-amber-500/15 blur-[120px] rounded-full opacity-70" />
        <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full" />
      </div>

      {/* ── Subtle Background Grid Pattern ────────────────────────────── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── Foreground Header Content ─────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md shadow-sm mb-6 transition-transform hover:scale-105 cursor-pointer">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide">ProjectHive 2.0 is Live</span>
          <span className="text-muted-foreground/60 text-xs">•</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">The University Collaboration Mesh</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Master Punchy Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] text-balance max-w-4xl">
          Find Your Team. <br className="hidden sm:inline" />
          Build Your Capstone. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
            Ship Your Future.
          </span>
        </h1>

        {/* Supporting Statement */}
        <p className="mt-6 text-base sm:text-xl text-muted-foreground font-normal max-w-2xl text-balance leading-relaxed">
          The all-in-one university incubation platform connecting student developers, designers, and researchers with Discord-grade squads, LiveKit SFU calling, and cascading AI assistance.
        </p>

        {/* High-Impact Conversion Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] hover:scale-[1.02] w-full sm:w-auto"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/teams"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-medium text-base transition-all duration-200 hover:scale-[1.02] w-full sm:w-auto backdrop-blur-md"
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Explore Squads</span>
          </Link>
        </div>

        {/* ── Developer Quick-Start CLI Strip (GitHub Signature) ──────── */}
        <div className="mt-6 inline-flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-xl bg-card/80 border border-border/70 font-mono text-xs text-muted-foreground backdrop-blur-md shadow-xs hover:border-primary/40 transition-all max-w-full overflow-hidden">
          <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground/90 truncate">$ git clone hive://capstone-2026/autonomous-drone</span>
          <button 
            onClick={() => { 
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText('git clone hive://capstone-2026/autonomous-drone');
              }
              setCopiedCli(true); 
              setTimeout(() => setCopiedCli(false), 2000); 
            }}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
            title="Copy clone command"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Trust & Social Proof Micro-Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/80 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free for all university students
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Zero-Trust Supabase security
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-500" /> Free Groq & Gemini AI intelligence
          </span>
        </div>
      </div>

      {/* ── Interactive Live Product Canvas (Linear/Stripe Grade) ────── */}
      <div className="relative z-10 w-full max-w-6xl mt-12 sm:mt-16 mx-auto">
        <div className="relative rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Mockup Window Topbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/60 bg-muted/40 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-rose-500/80" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-500/80" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-1 sm:ml-2 text-xs font-semibold text-foreground/80 flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="hidden sm:inline">ProjectHive Workspace — </span>Autonomous Drone AI
              </span>
            </div>

            {/* Interactive Preview Mode Tabs */}
            <div className="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5 text-[11px] sm:text-xs font-medium shrink-0">
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-2 sm:px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === '3d' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">3D Mesh</span>
                <span className="md:hidden">3D</span>
              </button>
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                  activeTab === 'squad' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="hidden md:inline">Squad Roster</span>
                <span className="md:hidden">Squad</span>
              </button>
              <button
                onClick={() => setActiveTab('calling')}
                className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                  activeTab === 'calling' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="hidden md:inline">LiveKit SFU</span>
                <span className="md:hidden">LiveKit</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chat
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="inline-flex items-center gap-1 text-emerald-500 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LiveKit SFU Connected
              </span>
            </div>
          </div>

          {/* Mockup Workspace Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] sm:min-h-[480px]">
            
            {/* Sidebar Mockup */}
            <div className="hidden md:flex flex-col col-span-3 border-r border-border/60 p-4 bg-muted/20">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Squads</div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-lg bg-primary/15 border border-primary/30 text-xs font-medium text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Drone Swarm AI
                  </span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">5/6</span>
                </div>
                <div className="p-2.5 rounded-lg hover:bg-muted/40 text-xs font-medium text-muted-foreground flex items-center justify-between cursor-pointer">
                  <span>Robotics Rover V2</span>
                  <span className="text-[10px] text-muted-foreground font-mono">4/6</span>
                </div>
                <div className="p-2.5 rounded-lg hover:bg-muted/40 text-xs font-medium text-muted-foreground flex items-center justify-between cursor-pointer">
                  <span>Smart Agri-IoT</span>
                  <span className="text-[10px] text-muted-foreground font-mono">6/6</span>
                </div>
              </div>

              <div className="mt-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">HiveMind Copilot</div>
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sprint Sprint-3 Ready
                </div>
                Sprint milestones synced. 2 tasks ready for review.
              </div>
            </div>

            {/* Central Interactive Content Area */}
            <div className="col-span-12 md:col-span-9 p-4 sm:p-6 flex flex-col justify-between bg-card/40">
              
              {/* Tab 0: 3D WebGL Collaboration Mesh Core */}
              {activeTab === '3d' && (
                <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0b0e14] via-[#07090e] to-black flex items-center justify-center border border-amber-500/20 shadow-inner">
                  <Hero3DEnvironment className="w-full h-full" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/60 text-[11px] sm:text-xs font-mono text-amber-400 flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span>WebGL 3D Core • Inertia Parallax Orbit</span>
                  </div>
                </div>
              )}

              {/* Tab 1: Squad Roster Preview */}
              {activeTab === 'squad' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        Autonomous Drone Swarm AI 
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold border border-emerald-500/20">
                          Recruiting
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground">CSE 499 Capstone Track • State University</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Seeking:</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono">PyTorch</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono">ROS2</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 font-bold text-xs flex items-center justify-center text-white">TB</div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                            Timon B. <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">Lead</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">AI Systems Engineer</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60">LeetCode 2140</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60">GitHub 500+</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-600 font-bold text-xs flex items-center justify-center text-white">SK</div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Sarah K.</div>
                          <div className="text-[11px] text-muted-foreground">Embedded C++ / ROS2</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60">STM32</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60">Gazebo</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center text-center p-4">
                      <Users className="w-6 h-6 text-primary mb-1" />
                      <div className="text-xs font-semibold text-foreground">1 Open Spot</div>
                      <div className="text-[11px] text-muted-foreground mb-2">Computer Vision Lead</div>
                      <Link href="/register" className="text-[11px] font-semibold text-primary hover:underline">
                        Apply to Join Squad →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: LiveKit Call Preview */}
              {activeTab === 'calling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-foreground">LiveKit HD Video Room: #drone-swarm-standup</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">Duration: 14:32</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/80 flex items-center justify-center shadow-lg">
                      <div className="text-xs font-semibold text-white/90">Timon (Speaking...)</div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-emerald-400">
                        <Mic className="w-3 h-3" />
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-white/70">State University</div>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-border/60 flex items-center justify-center">
                      <div className="text-xs font-semibold text-white/80">Sarah K.</div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white/70">
                        <Mic className="w-3 h-3" />
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-white/70">State University</div>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-indigo-950/60 border border-indigo-500/30 flex flex-col items-center justify-center text-center p-2">
                      <Sparkles className="w-5 h-5 text-indigo-400 mb-1" />
                      <div className="text-xs font-semibold text-indigo-200">HiveMind Bot</div>
                      <div className="text-[10px] text-indigo-300/80">Transcribing meeting...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Real-Time Chat Preview */}
              {activeTab === 'chat' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
                    <span className="font-semibold text-foreground">#squad-chat</span>
                    <span className="text-muted-foreground text-[11px]">Socket.IO 4.x • End-to-End Synced</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 font-bold text-[11px] flex items-center justify-center text-white shrink-0">TB</div>
                      <div className="bg-muted/50 p-2.5 rounded-2xl rounded-tl-sm text-xs text-foreground max-w-md">
                        <span className="font-semibold text-[11px] text-primary block mb-0.5">Timon Biswas</span>
                        I pushed the optical flow navigation pipeline to GitHub! Can someone review the PR?
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-full bg-background/80 border text-[10px] flex items-center gap-1 cursor-pointer">
                            🚀 4
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-background/80 border text-[10px] flex items-center gap-1 cursor-pointer">
                            🔥 3
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="bg-primary text-primary-foreground p-2.5 rounded-2xl rounded-tr-sm text-xs max-w-md">
                        On it! Testing the simulation in Gazebo now.
                        <div className="text-[10px] text-primary-foreground/70 text-right mt-1">✓✓ Read</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Bottom Control Dock */}
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">HiveMind AI prompt: "Summarize this sprint's Git commits"</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    href="/teams"
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Open Live App →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Live Performance Metrics Strip ───────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mt-12 sm:mt-16 mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-center">
        <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">Zero-Trust</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">34 Supabase RLS Schemas</div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">LiveKit SFU</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">4K Edge WebRTC Calling</div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">&lt; 50ms</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">Socket.IO Singapore Edge</div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">HiveMind AI</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">Dual Groq & Gemini Flash</div>
        </div>
      </div>
    </section>
  );
}
