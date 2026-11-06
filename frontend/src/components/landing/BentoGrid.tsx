'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Video, 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  Cpu, 
  Layers,
  Zap,
  Mic,
  MicOff,
  Code2
} from 'lucide-react';

export function BentoGrid() {
  const [selectedSkill, setSelectedSkill] = useState('Rust');
  const [micActive, setMicActive] = useState(true);
  const [aiPrompting, setAiPrompting] = useState(false);
  const [aiResponse, setAiResponse] = useState('Capstone PRD & Architecture generated for Autonomous Drone Delivery.');

  const handleGenerateAI = () => {
    setAiPrompting(true);
    setTimeout(() => {
      setAiPrompting(false);
      setAiResponse(
        selectedSkill === 'Rust' 
          ? 'Generated: Zero-allocation high-throughput streaming engine with Tokio & Axum.'
          : 'Generated: Distributed event-driven microservices architecture with Next.js & Supabase.'
      );
    }, 600);
  };

  return (
    <section id="features" className="w-full py-28 px-6 sm:px-12 bg-background relative overflow-hidden border-t border-border/40">
      {/* Subtle backdrop accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            Engineered For High-Output Teams
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl leading-tight">
            Every tool required to take ideas from <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">zero to shipped</span>.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
            Forget juggling five disconnected tabs. ProjectHive unifies squad recruitment, 4K WebRTC calling, persistent chat, and AI sprint scaffolding into one deterministic operating system.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Squad Matchmaking (Col Span 2) */}
          <div className="md:col-span-2 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-40 h-40 text-primary" />
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Pillar 01</div>
              <h3 className="text-2xl font-bold text-foreground">Intelligent Squad Matchmaking</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Pair with peers across verified universities based on complementary tech stacks, timezone overlap, and verified project contributions.
              </p>
            </div>

            {/* Interactive Widget inside Card 1 */}
            <div className="mt-8 pt-6 border-t border-border/60">
              <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Simulate Skill Filter:</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 98.4% Match Algorithm
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Rust', 'React 19', 'PyTorch', 'Go', 'Next.js', 'PostgreSQL'].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSkill === skill
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              {/* Matched Teammate Pill Card */}
              <div className="bg-background/80 border border-border/70 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    TB
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      Timon Biswas
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">
                        Lead Architect
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      BUET · Systems Engineering · Specializing in {selectedSkill}
                    </div>
                  </div>
                </div>
                <Link
                  href="/teams"
                  className="px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-all flex items-center gap-1.5"
                >
                  Invite to Squad <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: LiveKit SFU Real-Time Calling */}
          <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-violet-500/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">Pillar 02</div>
              <h3 className="text-2xl font-bold text-foreground">Ultra-Low Latency SFU Calling</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Crystal-clear 4K screen sharing and spatial audio powered by LiveKit SFU edge servers.
              </p>
            </div>

            {/* Live Audio Call Widget */}
            <div className="mt-8 bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">Sprint Standup #14</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">18ms latency</span>
              </div>

              {/* Audio waveform simulator */}
              <div className="h-10 bg-muted/40 rounded-xl px-3 flex items-center justify-center gap-1.5 mb-3">
                {[40, 75, 100, 60, 85, 30, 95, 50, 70, 85, 40, 65, 90, 45].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: micActive ? `${h}%` : '20%' }}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      micActive ? 'bg-violet-400' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    micActive
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  {micActive ? 'Mic Active' : 'Mic Muted'}
                </button>
                <span className="text-[11px] text-muted-foreground">4 Peers in Room</span>
              </div>
            </div>
          </div>

          {/* Card 3: HiveMind AI Copilot */}
          <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Pillar 03</div>
              <h3 className="text-2xl font-bold text-foreground">HiveMind Neural Copilot</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Generate full capstone blueprints, architecture diagrams, and DB schemas in seconds.
              </p>
            </div>

            {/* AI Interactive Prompt Box */}
            <div className="mt-8 bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" /> hivemind-v2
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">Ready</span>
              </div>

              <div className="text-xs font-sans bg-muted/40 p-2.5 rounded-lg text-foreground/90 border border-border/40 mb-3 min-h-[52px]">
                {aiPrompting ? (
                  <span className="inline-flex items-center gap-2 text-amber-400 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> Synthesizing architecture...
                  </span>
                ) : (
                  aiResponse
                )}
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={aiPrompting}
                className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5" /> Re-Scaffold Architecture
              </button>
            </div>
          </div>

          {/* Card 4: Sprint Kanban & Coursework Milestones */}
          <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Kanban className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Pillar 04</div>
              <h3 className="text-2xl font-bold text-foreground">Coursework Agile Kanban</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Keep semester milestones on schedule with sprint velocity tracking, task dependencies, and git commits.
              </p>
            </div>

            {/* Kanban Columns Preview */}
            <div className="mt-8 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background/80 border border-border/70 rounded-xl p-3">
                <div className="font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                  <span>IN PROGRESS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
                <div className="p-2 rounded bg-muted/60 text-foreground font-medium mb-1.5 text-[11px] border border-border/40">
                  Implement LiveKit Webhooks
                </div>
                <div className="p-2 rounded bg-muted/60 text-foreground font-medium text-[11px] border border-border/40">
                  Supabase RLS Policy Audit
                </div>
              </div>

              <div className="bg-background/80 border border-border/70 rounded-xl p-3">
                <div className="font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                  <span>DONE / SHIPPED</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-300 font-medium mb-1.5 text-[11px] border border-emerald-500/20">
                  Authentication Hardening
                </div>
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-300 font-medium text-[11px] border border-emerald-500/20">
                  Next.js 16 Webpack Setup
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Real-Time Persistent Messaging */}
          <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Pillar 05</div>
              <h3 className="text-2xl font-bold text-foreground">Squad Rooms & Direct Chat</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sub-millisecond WebSockets deliver rich markdown, syntax-highlighted code snippets, and inline file attachments.
              </p>
            </div>

            {/* Chat Box Snippet */}
            <div className="mt-8 bg-background/80 border border-border/70 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                  AL
                </div>
                <div className="text-xs">
                  <div className="font-bold text-foreground">Alex Lin <span className="text-[10px] text-muted-foreground font-normal">14:28</span></div>
                  <div className="text-muted-foreground bg-muted/40 p-2 rounded-lg mt-1 border border-border/40 font-mono text-[11px]">
                    <span className="text-primary">const</span> token = <span className="text-cyan-400">await</span> createSession(room);
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5 pl-9">
                <CheckCircle2 className="w-3 h-3" /> Delivered & synced across 4 teammates
              </div>
            </div>
          </div>

          {/* Card 6: Zero-Trust Security & Institutional Assurance (Col Span 3) */}
          <div className="md:col-span-3 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-primary/40 transition-all duration-300 relative overflow-hidden group shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Pillar 06 · Enterprise Grade</div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Zero-Trust Institutional Security & Two-Way Admin Helpline</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Row-level security (RLS) guarantees your intellectual property and capstone repos remain completely isolated. Emergency helpline dispatch provides instant dispute resolution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-xl bg-background border border-border/80 text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                16 RLS Shields Active
              </div>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:bg-foreground/90 transition-all flex items-center gap-1.5"
              >
                Create Free Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

