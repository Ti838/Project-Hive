'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Video, 
  MessageSquare, 
  Sparkles, 
  Kanban, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Flame, 
  Rocket, 
  Mic, 
  MicOff, 
  Share2, 
  FileCode2, 
  ExternalLink 
} from 'lucide-react';

export function Showcase() {
  const [activeTab, setActiveTab] = useState<'squads' | 'calling' | 'chat' | 'ai' | 'kanban'>('squads');

  const tabs = [
    { id: 'squads', label: 'Squad Discovery', icon: Users, desc: 'Find teammates matched by university, major, and verified skills.' },
    { id: 'calling', label: 'LiveKit 4K Calling', icon: Video, desc: 'Ultra-low latency SFU group calling with Picture-in-Picture.' },
    { id: 'chat', label: 'Real-Time Messaging', icon: MessageSquare, desc: 'WhatsApp-grade chat with delivery receipts and emoji reactions.' },
    { id: 'ai', label: 'HiveMind AI Copilot', icon: Sparkles, desc: 'Cascading AI with Groq sub-500ms and Gemini Flash vision.' },
    { id: 'kanban', label: 'Sprint Kanban & Wiki', icon: Kanban, desc: 'Notion-grade documentation and sprint deliverable tracking.' },
  ];

  return (
    <section id="showcase" className="relative w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Product Showcase
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Everything You Need to <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Build and Ship Together
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          Explore how ProjectHive unifies team recruitment, real-time communication, and AI-powered project incubation in one cohesive experience.
        </p>
      </div>

      {/* ── Tab Selector Strip ────────────────────────────────────────── */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                  : 'bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Interactive Stage Showcase Canvas ─────────────────────────── */}
      <div className="relative rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden p-6 sm:p-10 min-h-[500px]">
        
        {/* Tab 1: Squad Discovery Showcase */}
        {activeTab === 'squads' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Discord-Grade Teamwork</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Assemble High-Velocity Academic Squads
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stop begging on WhatsApp or Reddit. Discover teammates by university course, programming languages, and verified GitHub & LeetCode accomplishments.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive applicant approval drawers with one-click decisioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dynamic recruiting indicators (Actively Recruiting vs Squad Full)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Leadership delegation and peer skill endorsements</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  Explore Active University Squads <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-border/60 bg-muted/30 p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    AI
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      Autonomous Robotics Lab
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                        🟢 Recruiting
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">State University • Capstone CSE 499</div>
                  </div>
                </div>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold">
                  4/6 Members
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background/80 border border-border/60">
                  <div className="text-xs font-semibold text-foreground">Timon B. (Lead)</div>
                  <div className="text-[11px] text-muted-foreground">Full-Stack & Distributed Systems</div>
                  <div className="mt-2 text-[10px] text-primary font-mono">GitHub: Ti838</div>
                </div>
                <div className="p-3 rounded-lg bg-background/80 border border-border/60">
                  <div className="text-xs font-semibold text-foreground">Sarah K.</div>
                  <div className="text-[11px] text-muted-foreground">Computer Vision & PyTorch</div>
                  <div className="mt-2 text-[10px] text-purple-400 font-mono">LeetCode: 2140</div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Looking for: Embedded ROS2 Developer</div>
                  <div className="text-[11px] text-muted-foreground">Experience with micro-ROS & Gazebo preferred</div>
                </div>
                <Link href="/register" className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  Join Squad
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: LiveKit Calling Showcase */}
        {activeTab === 'calling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-mono font-semibold text-indigo-500 uppercase tracking-wider">LiveKit Cloud SFU Engine</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Low-Latency 4K Video Calling with Ambient PiP
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect instantly with your team. Powered by LiveKit Cloud's Selective Forwarding Unit (SFU), you get crystal-clear multi-peer video, screen sharing, and automatic bandwidth adaptation.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Floating Picture-in-Picture (PiP) ambient call widget</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time active speaker audio waveforms & glowing indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Auto-reconnection resilience across mobile and desktop</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-border/60 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-white/80 pb-2 border-b border-white/10">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LiveKit SFU Room: #squad-daily-standup
                </span>
                <span className="font-mono text-white/50">Active: 3 Peers</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 aspect-video">
                <div className="relative rounded-lg overflow-hidden bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">Timon (Speaking...)</span>
                  <div className="absolute top-2 right-2 bg-black/60 px-1 rounded text-[10px] text-emerald-400">
                    <Mic className="w-3 h-3" />
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white/80">Sarah K.</span>
                  <div className="absolute top-2 right-2 bg-black/60 px-1 rounded text-[10px] text-white/50">
                    <Mic className="w-3 h-3" />
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white/80">David M.</span>
                  <div className="absolute top-2 right-2 bg-black/60 px-1 rounded text-[10px] text-white/50">
                    <MicOff className="w-3 h-3 text-rose-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Real-Time Messaging Showcase */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-mono font-semibold text-emerald-500 uppercase tracking-wider">Socket.IO 4.x Messaging</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                WhatsApp-Grade Real-Time Communication
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Experience seamless team conversations with sub-50ms message latency, read receipts, emoji reactions, and direct clipboard image pasting.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Exact delivery state (Sending → Sent → Delivered → Read)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant screenshot pasting via Ctrl+V</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Direct DMs and room-isolated squad channels</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-border/60 bg-muted/30 p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  TB
                </div>
                <div className="bg-background border border-border/60 p-3 rounded-2xl rounded-tl-sm text-xs text-foreground max-w-md shadow-sm">
                  <span className="font-semibold text-primary block text-[11px] mb-0.5">Timon Biswas</span>
                  Here is the CAD model preview for the drone chassis. Check the dimensions!
                  <div className="mt-2 p-2 rounded bg-muted/50 border border-border/40 text-[11px] font-mono flex items-center justify-between">
                    <span>drone_chassis_v2.step (4.2 MB)</span>
                    <span className="text-primary font-semibold cursor-pointer">Download</span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-muted border text-[10px]">🔥 3</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted border text-[10px]">👍 2</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-xs max-w-md shadow-sm">
                  Looks perfect! Printing the 3D prototype in the engineering lab now.
                  <div className="text-[10px] text-primary-foreground/70 text-right mt-1">✓✓ Read 10:24 AM</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: HiveMind AI Showcase */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-mono font-semibold text-purple-500 uppercase tracking-wider">Cascading Multimodal AI</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                HiveMind: Your Built-In Engineering Copilot
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Supercharge your sprint planning and debugging. HiveMind cascades queries across Groq Llama 3.3 70B (sub-500ms) and Gemini 2.5 Flash for vision and multimodal reasoning.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sub-second code reviews, bug explanations, and architecture advice</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Paste circuit schematics or UI mockups for instant vision analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hands-free voice dictation and voice speech feedback</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 pb-2 border-b border-indigo-500/20">
                <Sparkles className="w-4 h-4" /> HiveMind Engineering Assistant (Groq Cloud Tier)
              </div>
              <div className="text-xs text-muted-foreground bg-background/60 p-3 rounded-lg border border-border/40">
                <span className="font-semibold text-foreground block mb-1">User Prompt:</span>
                "Generate acceptance criteria for our autonomous takeoff safety check."
              </div>
              <div className="text-xs text-foreground bg-indigo-500/10 p-3.5 rounded-lg border border-indigo-500/20 leading-relaxed font-mono">
                <span className="text-indigo-400 font-bold block mb-1">HiveMind Generated Criteria:</span>
                1. GPS fix locks $\ge$ 8 satellites before motor arming.<br />
                2. Battery cell voltage $\ge$ 3.8V per cell.<br />
                3. LIDAR optical flow obstacle distance $\ge$ 2.0 meters.<br />
                4. Failover return-to-home (RTH) waypoint stored in non-volatile flash.
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Sprint Kanban Showcase */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">Agile University Workflow</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Notion-Grade Wikis & Kanban Task Boards
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stay aligned with academic deadlines. Track coursework milestones, sprint Kanban tasks, rubric compliance, and GitHub turn-in links.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Kanban board categorized into To Do, In Progress, Review, and Done</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Collaborative Markdown wiki for architecture specs & meeting notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1-click capstone deliverable links (GitHub PRs, Live Demos)</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2">To Do (2)</div>
                <div className="p-2.5 rounded bg-background border border-border/60 text-xs font-medium space-y-1 shadow-sm">
                  <div>Motor ESC calibration</div>
                  <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">High</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[11px] font-bold text-indigo-400 uppercase mb-2">In Progress (1)</div>
                <div className="p-2.5 rounded bg-background border border-indigo-500/30 text-xs font-medium space-y-1 shadow-sm">
                  <div>LIDAR slam node</div>
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Sarah K.</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[11px] font-bold text-emerald-400 uppercase mb-2">Done (4)</div>
                <div className="p-2.5 rounded bg-background border border-emerald-500/30 text-xs font-medium space-y-1 shadow-sm opacity-80">
                  <div>Chassis 3D print</div>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓ Complete</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
