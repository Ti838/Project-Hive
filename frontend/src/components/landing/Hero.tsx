'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  Video, 
  Kanban,
  Bot,
  Mic, 
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  CheckCircle2, 
  Clock,
  ShieldCheck, 
  Cpu, 
  Layers,
  FolderKanban,
  Terminal,
  Send,
  ExternalLink,
  Plus
} from 'lucide-react';

export function Hero() {
  const [activeTab, setActiveTab] = useState<'squad' | 'kanban' | 'calling' | 'ai'>('squad');
  const [hasApplied, setHasApplied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    'task-done-1': true,
    'task-done-2': true,
  });

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
          <span className="text-xs font-semibold text-primary tracking-wide">{BRAND_CONFIG.name} {BRAND_CONFIG.version} is Live</span>
          <span className="text-muted-foreground/60 text-xs">•</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{BRAND_CONFIG.tagline}</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Master Headline */}
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

      {/* ── Interactive Live Product Canvas (Linear/Raycast Grade) ────── */}
      <div className="relative z-10 w-full max-w-6xl mt-12 sm:mt-16 mx-auto">
        <div className="relative rounded-2xl border border-border/80 bg-card/70 backdrop-blur-2xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Mockup Window Topbar */}
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-border/60 bg-muted/40 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-xs" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-xs" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-xs" />
              </div>
              <span className="ml-1 sm:ml-2 text-xs font-semibold text-foreground/85 flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                <span className="hidden sm:inline text-muted-foreground font-normal">{BRAND_CONFIG.name} / </span>
                <span className="font-semibold text-foreground">Autonomous Drone AI</span>
              </span>
            </div>

            {/* Interactive Mode Tabs */}
            <div className="flex items-center bg-background/90 border border-border/70 rounded-xl p-1 text-[11px] sm:text-xs font-medium shrink-0 shadow-inner">
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'squad' 
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Squad Hub</span>
                <span className="sm:hidden">Squad</span>
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'kanban' 
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sprint Kanban</span>
                <span className="sm:hidden">Sprint</span>
              </button>
              <button
                onClick={() => setActiveTab('calling')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'calling' 
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LiveKit SFU</span>
                <span className="sm:hidden">LiveKit</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai' 
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">HiveMind AI</span>
                <span className="sm:hidden">AI</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LiveKit SFU • 18ms Edge
              </span>
            </div>
          </div>

          {/* Mockup Workspace Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] sm:min-h-[500px]">
            
            {/* Sidebar Mockup */}
            <div className="hidden md:flex flex-col col-span-3 border-r border-border/60 p-4 bg-muted/20 justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <span>Active Squads</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">3 Active</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30 text-xs font-semibold text-foreground flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">Drone Swarm AI</span>
                    </span>
                    <span className="text-[10px] bg-primary/25 text-primary px-1.5 py-0.5 rounded font-mono shrink-0">4/5</span>
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-muted/40 text-xs font-medium text-muted-foreground flex items-center justify-between cursor-pointer transition-colors">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      <span className="truncate">Robotics Rover V2</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">3/4</span>
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-muted/40 text-xs font-medium text-muted-foreground flex items-center justify-between cursor-pointer transition-colors">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      <span className="truncate">Smart Agri-IoT</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">5/6</span>
                  </div>
                </div>

                <div className="mt-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  HiveMind Copilot
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sprint 3: Milestones Synced</span>
                  </div>
                  <p className="text-[11px]">2 tasks ready for review. Standup summary generated.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Link
                  href="/teams/create"
                  className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Capstone Squad</span>
                </Link>
              </div>
            </div>

            {/* Central Interactive Content Area */}
            <div className="col-span-12 md:col-span-9 p-4 sm:p-6 flex flex-col justify-between bg-card/40">
              
              {/* Tab 1: Squad Hub (Default View) */}
              {activeTab === 'squad' && (
                <div className="space-y-4">
                  {/* Squad Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/50">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          Autonomous AI Drone Navigation & Swarm Tracking
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold border border-emerald-500/20">
                          Recruiting (1 Spot)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-semibold border border-indigo-500/20">
                          98% Match
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        CSE 499 Senior Design Capstone • Autonomous Systems & Robotics Track
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/50">PyTorch</span>
                      <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/50">ROS2</span>
                      <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/50">FastAPI</span>
                    </div>
                  </div>

                  {/* Squad Members Roster */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Member 1: Lead */}
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/25 flex flex-col justify-between hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-sm">
                          TB
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                            <span className="truncate">Timon B.</span>
                            <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-semibold shrink-0">Lead</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">AI Systems Architect</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">BUET CSE</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">LeetCode 2140</span>
                      </div>
                    </div>

                    {/* Member 2: Embedded */}
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/25 flex flex-col justify-between hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-sm">
                          SK
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">Sarah K.</div>
                          <div className="text-[11px] text-muted-foreground truncate">Embedded C++ & ROS2</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">DU CS</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">Gazebo Sim</span>
                      </div>
                    </div>

                    {/* Member 3: Full-Stack */}
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/25 flex flex-col justify-between hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-sm">
                          RM
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">Rayan M.</div>
                          <div className="text-[11px] text-muted-foreground truncate">Fullstack & WebRTC</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">BRACU CSE</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">Next.js 15</span>
                      </div>
                    </div>

                    {/* Open Spot: Call to Action */}
                    <div className="p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center text-center">
                      <Users className="w-5 h-5 text-primary mb-1" />
                      <div className="text-xs font-bold text-foreground">1 Open Spot</div>
                      <div className="text-[11px] text-muted-foreground mb-2">Computer Vision & SLAM</div>
                      <button
                        onClick={() => setHasApplied(true)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          hasApplied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
                        }`}
                      >
                        {hasApplied ? 'Applied ✓ (Under Review)' : 'Apply to Squad →'}
                      </button>
                    </div>
                  </div>

                  {/* Team Milestone Progress */}
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Capstone Sprint Progress: Cycle 3
                      </span>
                      <span className="font-mono text-muted-foreground">84% Completed</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full w-[84%] transition-all duration-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Sprint Kanban */}
              {activeTab === 'kanban' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <span>Sprint 3: SLAM & Sensor Integration</span>
                        <span className="text-xs font-mono font-normal text-muted-foreground">• 3 Days Remaining</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">Autonomous Drone AI Board</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      On Schedule
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Column 1: In Progress */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>In Progress</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">2</span>
                      </div>
                      
                      <div className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">Critical</span>
                          <span className="text-[10px] font-mono text-muted-foreground">#CV-41</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          Fine-tune YOLOv11 on custom drone obstacle dataset
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span>Assignee: Timon B.</span>
                          <span className="font-mono text-primary font-semibold">5 pts</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">High</span>
                          <span className="text-[10px] font-mono text-muted-foreground">#HW-19</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          SPI sensor bridge for LiDAR depth point clouds
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span>Assignee: Sarah K.</span>
                          <span className="font-mono text-primary font-semibold">3 pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: In Code Review */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>In Review</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">1</span>
                      </div>

                      <div className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-500/5 transition-all shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PR #88</span>
                          <span className="text-[10px] font-mono text-muted-foreground">WebRTC</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          LiveKit SFU 4K low-latency data channel stream bridge
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span>Assignee: Rayan M.</span>
                          <span className="text-indigo-400 font-semibold">Ready to Merge</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Done */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>Completed</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">2</span>
                      </div>

                      <div 
                        onClick={() => toggleTask('task-done-1')}
                        className={`p-3 rounded-xl border border-border/60 bg-muted/20 transition-all cursor-pointer space-y-1.5 ${
                          completedTasks['task-done-1'] ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <p className="text-xs font-medium text-foreground line-through">
                            Supabase RLS Zero-Trust schemas
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-5 font-mono">Merged to main</span>
                      </div>

                      <div 
                        onClick={() => toggleTask('task-done-2')}
                        className={`p-3 rounded-xl border border-border/60 bg-muted/20 transition-all cursor-pointer space-y-1.5 ${
                          completedTasks['task-done-2'] ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <p className="text-xs font-medium text-foreground line-through">
                            Gazebo quadcopter physics model test
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-5 font-mono">Simulation verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: LiveKit Call Preview */}
              {activeTab === 'calling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        LiveKit SFU 4K Room: #drone-swarm-standup
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="hidden sm:inline text-emerald-400">1080p60 • 18ms</span>
                      <span>18:42</span>
                    </div>
                  </div>

                  {/* Video Tile Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Active Speaker */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500 flex flex-col items-center justify-center shadow-lg group">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md mb-1">
                        TB
                      </div>
                      <div className="text-xs font-semibold text-white/95">Timon Biswas</div>
                      <div className="text-[10px] text-white/60">Speaking (Lead)</div>
                      
                      {/* Active Audio Waveform Bars */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-end gap-0.5 h-3">
                        <span className="w-1 bg-emerald-400 rounded-full h-2 animate-bounce" />
                        <span className="w-1 bg-emerald-400 rounded-full h-3 animate-pulse" />
                        <span className="w-1 bg-emerald-400 rounded-full h-1.5 animate-bounce" />
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
                        <Mic className="w-3 h-3" />
                        <span>HQ</span>
                      </div>
                    </div>

                    {/* Peer Tile 2 */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-border/60 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md mb-1">
                        SK
                      </div>
                      <div className="text-xs font-semibold text-white/90">Sarah K.</div>
                      <div className="text-[10px] text-white/60">Screen Sharing: Gazebo Sim</div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">
                        <Mic className="w-3 h-3" />
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                        DU CS
                      </div>
                    </div>

                    {/* Peer Tile 3: HiveMind Copilot Bot */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-indigo-950/70 border border-indigo-500/40 flex flex-col items-center justify-center text-center p-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-1.5 shadow-inner">
                        <Bot className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="text-xs font-bold text-indigo-200">HiveMind Meeting Copilot</div>
                      <div className="text-[11px] text-indigo-300/80 mt-1 leading-tight">
                        Transcribing meeting audio & generating action items...
                      </div>
                    </div>
                  </div>

                  {/* Call Controls Dock */}
                  <div className="flex items-center justify-center gap-2.5 pt-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isMuted 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : 'bg-muted/60 text-foreground border-border/60 hover:bg-muted'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                      <span>{isMuted ? 'Muted' : 'Mute'}</span>
                    </button>
                    <button className="p-2.5 rounded-xl border border-border/60 bg-muted/60 hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Share2 className="w-4 h-4 text-primary" />
                      <span className="hidden sm:inline">Share Screen</span>
                    </button>
                    <button className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <PhoneOff className="w-4 h-4" />
                      <span className="hidden sm:inline">Leave Room</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: HiveMind AI Copilot Studio */}
              {activeTab === 'ai' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        HiveMind Capstone AI Copilot
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                      Dual Groq Llama 3.3 + Gemini Flash
                    </span>
                  </div>

                  {/* AI Interaction Stream */}
                  <div className="space-y-3">
                    {/* User Prompt */}
                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-xs max-w-lg leading-relaxed shadow-sm">
                        "Draft the IEEE System Architecture section for our Drone Swarm Capstone with ROS2 & WebRTC telemetry."
                      </div>
                    </div>

                    {/* AI Response Card */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-muted/40 border border-border/70 p-3.5 rounded-2xl rounded-tl-sm text-xs text-foreground max-w-xl space-y-2 leading-relaxed">
                        <div className="font-semibold text-primary flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Generated Capstone Architecture Specification (IEEE Std 1016)</span>
                        </div>
                        <p className="text-muted-foreground">
                          1. <strong>Sensory Ingestion Layer:</strong> Dual RGB-D Depth Camera + RPLiDAR A3 running at 40Hz via ROS2 node bridges.
                        </p>
                        <p className="text-muted-foreground">
                          2. <strong>Swarm Edge Compute:</strong> Jetson Orin Nano executing quantized YOLOv11 + RTAB-Map 3D SLAM.
                        </p>
                        <p className="text-muted-foreground">
                          3. <strong>Telemetry & Base Station:</strong> LiveKit SFU data-channels delivering &lt;20ms state sync to {BRAND_CONFIG.name} workspace.
                        </p>

                        <div className="pt-2 flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-background border border-border text-[10px] text-primary font-semibold">
                            + 3 Sprint Tasks Created
                          </span>
                          <span className="px-2 py-0.5 rounded bg-background border border-border text-[10px] text-muted-foreground font-mono">
                            Latency: 284ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Interactive Control Dock */}
              <div className="mt-5 pt-3.5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">
                    Ready to launch your capstone? Assemble your university squad in seconds.
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    href="/teams"
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Browse All Squads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Live Performance Metrics Strip ───────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mt-12 sm:mt-16 mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-center">
        <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">Zero-Trust</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">34 Supabase RLS Schemas</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">LiveKit SFU</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">4K Edge WebRTC Calling</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">&lt; 50ms</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">Socket.IO Real-Time Edge</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="text-lg sm:text-2xl font-extrabold text-foreground">HiveMind AI</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">Dual Groq & Gemini Flash</div>
        </div>
      </div>
    </section>
  );
}
