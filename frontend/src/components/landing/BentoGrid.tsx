'use client';

import React, { useState } from 'react';
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
  GitPullRequest,
  GitMerge,
  GitCommit,
  Check,
  Copy,
  ChevronRight,
  Code2,
  FileCode,
  Radio,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

export function BentoGrid() {
  // ── Card 1: Interactive PR State ──
  const [prMerged, setPrMerged] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);

  // ── Card 2: SFU LiveKit Waveform & Calling State ──
  const [micActive, setMicActive] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState<'timon' | 'anika' | 'tahmid'>('timon');

  // ── Card 3: AI Copilot Cascade State ──
  const [aiTier, setAiTier] = useState<'groq' | 'gemini' | 'openrouter'>('groq');
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);

  const aiPrompts = [
    {
      label: 'Drone Capstone PRD',
      tier: 'Groq Llama 3.3 70B',
      latency: '38ms TTFT',
      throughput: '820 tok/s',
      output: `export const DroneMissionPlan = {\n  sensors: ["LiDAR", "IMU-6050", "YOLOv8-Nano"],\n  sfuStream: "livekit.hive.internal/stream/drone-01",\n  targetCampus: "BUET Main Ground",\n  failsafe: "Return-To-Home via Supabase GPS telemetry"\n};`
    },
    {
      label: 'Supabase RLS Policy',
      tier: 'Gemini 2.5 Flash',
      latency: '62ms TTFT',
      throughput: '410 tok/s',
      output: `CREATE POLICY "Students can only access verified capstone squad repos"\nON public.squad_repositories\nFOR ALL\nUSING (auth.jwt() ->> 'email' LIKE '%@%.ac.bd');`
    },
    {
      label: 'IEEE Citation Graph',
      tier: 'OpenRouter Free Cascade',
      latency: '85ms TTFT',
      throughput: '340 tok/s',
      output: `@article{projecthive2026,\n  author = {Biswas, T. and Academic Squad 04},\n  title = {Decentralized WebRTC SFU Mesh for University Incubation},\n  journal = {IEEE Transactions on Learning Technologies},\n  year = {2026}\n}`
    }
  ];

  // ── Card 4: Interactive Kanban State ──
  const [kanbanTasks, setKanbanTasks] = useState([
    { id: 1, title: 'LiveKit SFU Dhaka Edge Relay', status: 'done', tag: 'WebRTC' },
    { id: 2, title: 'Supabase RLS Zero-Trust Policies', status: 'done', tag: 'Security' },
    { id: 3, title: 'Train YOLOv8 Drone Obstacle Model', status: 'progress', tag: 'PyTorch' },
    { id: 4, title: 'IEEE Final Capstone Thesis Draft', status: 'backlog', tag: 'Paper' }
  ]);

  const advanceTask = (taskId: number) => {
    setKanbanTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (t.status === 'backlog') return { ...t, status: 'progress' };
        if (t.status === 'progress') return { ...t, status: 'done' };
        return { ...t, status: 'backlog' };
      }
      return t;
    }));
  };

  const handleCopyCode = () => {
    setCopiedPr(true);
    setTimeout(() => setCopiedPr(false), 2000);
  };

  return (
    <section id="features" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-12 bg-background relative overflow-hidden border-t border-border/40">
      {/* ── Ambient Radial Glow Cones (GitHub Style) ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        
        {/* ── Section Header ── */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-mono font-semibold tracking-wide uppercase mb-4 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Developer-First Architecture • Reverse-Engineered Caliber
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight text-balance">
            Engineered like <span className="bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">GitHub</span>. Tailored for <span className="underline decoration-primary/40 decoration-wavy">University Builders</span>.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            From unified code pull requests to sub-second SFU audio rooms and 3-tier cascading AI intelligence—every pillar functions as a deterministic building block.
          </p>
        </div>

        {/* ── Master Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* ───────────────────────────────────────────────────────────── */}
          {/* PILLAR 1: GITHUB-STYLE INTERACTIVE PULL REQUEST & CODE DIFF  */}
          {/* (Spans 8 columns on desktop for commanding hero presence)   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:col-span-8 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
            
            {/* Ambient Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <GitPullRequest className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Pillar 01 • Collaborative Version Control</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">Interactive Capstone Pull Request</h3>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                    <Check className="w-3 h-3" /> CI: 4/4 passing
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground max-w-2xl mb-6">
                Pair review, resolve inline comments, and merge cross-university capstone modules with deterministic zero-trust precision.
              </p>

              {/* ── Interactive PR Diff Visualizer Mockup (GitHub Native Look) ── */}
              <div className="rounded-2xl border border-border/80 bg-background/90 overflow-hidden shadow-sm">
                
                {/* PR Top Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/70 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono flex items-center gap-1.5 ${
                      prMerged 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {prMerged ? <GitMerge className="w-3.5 h-3.5" /> : <GitPullRequest className="w-3.5 h-3.5" />}
                      {prMerged ? 'Merged' : 'Open'}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate">
                      feat(squad-mesh): LiveKit SFU + Supabase RLS #142
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button 
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      title="Copy diff snippet"
                    >
                      {copiedPr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setPrMerged(!prMerged)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        prMerged
                          ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      }`}
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      {prMerged ? 'Revert Merge' : 'Merge pull request'}
                    </button>
                  </div>
                </div>

                {/* File Header Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/50 text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-primary" />
                    <span>src/mesh/squad-orchestrator.ts</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">+18 -6 lines</span>
                </div>

                {/* Unified Code Diff Viewer */}
                <div className="p-3 sm:p-4 font-mono text-xs overflow-x-auto leading-relaxed space-y-1 bg-black/40">
                  <div className="text-muted-foreground/60 text-[11px]">@@ -18,6 +18,10 @@ export async function initSquad()</div>
                  
                  {/* Deleted line */}
                  <div className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 flex items-start gap-2">
                    <span className="select-none text-rose-400/80 font-bold">-</span>
                    <span className="truncate">// Legacy: unverified WhatsApp coordination</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 flex items-start gap-2">
                    <span className="select-none text-rose-400/80 font-bold">-</span>
                    <span className="truncate">const comms = createP2PUnencryptedSocket();</span>
                  </div>

                  {/* Added lines */}
                  <div className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex items-start gap-2">
                    <span className="select-none text-emerald-400 font-bold">+</span>
                    <span className="truncate">const room = await livekit.createSFURoom(&quot;drone-swarm-buet&quot;);</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex items-start gap-2">
                    <span className="select-none text-emerald-400 font-bold">+</span>
                    <span className="truncate">await supabase.rls.enforceVerifiedDomains([&quot;buet.ac.bd&quot;, &quot;du.ac.bd&quot;]);</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex items-start gap-2">
                    <span className="select-none text-emerald-400 font-bold">+</span>
                    <span className="truncate">const copilot = await hivemind.cascade([&quot;groq&quot;, &quot;gemini&quot;]);</span>
                  </div>
                </div>

                {/* Inline PR Discussion Comment Box (GitHub Signature) */}
                <div className="p-3.5 bg-muted/30 border-t border-border/70 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-400/40">
                    TB
                  </div>
                  <div className="text-xs space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Timon Biswas (Lead)</span>
                      <span className="text-[10px] text-muted-foreground">commented 4 minutes ago</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                        Author
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-normal">
                      Verified LiveKit SFU packet latency at <span className="text-emerald-400 font-semibold font-mono">42ms</span> between BUET and DU edge relays. Zero packet loss under 1080p 60fps screen share. Ready for capstone evaluation! 🚀
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-3">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <GitCommit className="w-3.5 h-3.5 text-primary" /> Commit: <span className="text-foreground font-semibold">d7d89d0</span> (Verified GPG)
              </span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Type-Safe Next.js 16
              </span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PILLAR 2: LIVEKIT CLOUD SFU MESH & AUDIO SPECTRUM RADAR      */}
          {/* (Spans 4 columns on desktop)                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:col-span-4 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-violet-500/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
                <Radio className="w-5 h-5" />
              </div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-violet-400 mb-1">Pillar 02 • Real-Time Voice</div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">LiveKit SFU 4K Mesh</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Broadcast low-latency spatial audio and ultra-crisp screen sharing directly inside your capstone war-room.
              </p>
            </div>

            {/* Live Audio Call HUD Widget */}
            <div className="mt-8 bg-background/90 border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-foreground">Sprint Standup #14</span>
                </div>
                <span className="font-mono text-violet-400 font-semibold text-[11px]">42ms ping</span>
              </div>

              {/* Dynamic Equalizer Waveform Simulator */}
              <div className="h-12 bg-muted/30 rounded-xl px-3 flex items-center justify-center gap-1.5 mb-3 border border-border/40">
                {[35, 70, 95, 55, 80, 25, 90, 45, 65, 85, 40, 60, 90, 45, 75, 30].map((h, i) => (
                  <span
                    key={i}
                    style={{ 
                      height: micActive ? `${Math.max(20, (h * ((i % 3) + 1)) % 100)}%` : '15%' 
                    }}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      micActive ? 'bg-violet-400' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Active Speaker Indicator */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    micActive
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  {micActive ? 'Mic Active' : 'Muted'}
                </button>

                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-background flex items-center justify-center text-[10px] font-bold text-white">TB</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-background flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                  <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-background flex items-center justify-center text-[10px] font-bold text-white">TH</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
              <span>Opus Codec • 48kHz</span>
              <span className="text-emerald-400">Dhaka Edge SFU Active</span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PILLAR 3: HIVEMIND CASCADING AI TERMINAL (COPILOT CALIBER)   */}
          {/* (Spans 6 columns on desktop)                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:col-span-6 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 mb-1">Pillar 03 • Autonomous Intelligence</div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">HiveMind Cascading Copilot</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Groq Llama 3.3 for sub-second sprint plans, Gemini 2.5 Flash for vision, and OpenRouter for free redundancy.
              </p>
            </div>

            {/* Interactive Copilot Terminal Console */}
            <div className="mt-6 bg-black/60 border border-border/80 rounded-2xl p-4 font-mono text-xs shadow-inner">
              
              {/* Terminal Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40 text-muted-foreground text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-foreground font-semibold">hivemind-cascade</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {aiPrompts[selectedPromptIndex].throughput}
                  </span>
                  <span className="text-emerald-400">
                    {aiPrompts[selectedPromptIndex].latency}
                  </span>
                </div>
              </div>

              {/* Prompt Preset Selector Pills */}
              <div className="flex flex-wrap gap-1.5 my-3">
                {aiPrompts.map((p, idx) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setAiTyping(true);
                      setSelectedPromptIndex(idx);
                      setTimeout(() => setAiTyping(false), 250);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                      selectedPromptIndex === idx
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Code / Output Container */}
              <pre className="p-3 rounded-xl bg-card/60 border border-border/40 text-[11px] text-amber-300 overflow-x-auto leading-relaxed max-h-[140px] whitespace-pre">
                {aiTyping ? 'Generating deterministic response...' : aiPrompts[selectedPromptIndex].output}
              </pre>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Model: {aiPrompts[selectedPromptIndex].tier}</span>
                <span className="text-emerald-400">Zero Cost • Academic Tier</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Automatic Circuit Breakers</span>
              <span className="font-mono text-foreground font-semibold">Failover: Groq ➔ Gemini ➔ OpenRouter</span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PILLAR 4: SPRINT KANBAN & COURSEWORK MILESTONES (INTERACTIVE) */}
          {/* (Spans 6 columns on desktop)                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:col-span-6 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                <Kanban className="w-5 h-5" />
              </div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 mb-1">Pillar 04 • Academic Milestones</div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">Interactive Sprint Kanban</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Click any task card below to advance its lifecycle from backlog to shipped production capstone.
              </p>
            </div>

            {/* Interactive Kanban Columns */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              
              {/* Backlog */}
              <div className="bg-background/80 border border-border/70 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center justify-between">
                    <span>Backlog</span>
                    <span className="text-muted-foreground">1</span>
                  </div>
                  {kanbanTasks.filter(t => t.status === 'backlog').map(t => (
                    <div 
                      key={t.id}
                      onClick={() => advanceTask(t.id)}
                      className="p-2 rounded-lg bg-muted/60 hover:bg-primary/20 border border-border/60 cursor-pointer transition-all mb-1.5"
                    >
                      <div className="font-semibold text-foreground text-[11px]">{t.title}</div>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-background/80 border border-border/70 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[10px] font-bold text-amber-400 uppercase mb-2 flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  {kanbanTasks.filter(t => t.status === 'progress').map(t => (
                    <div 
                      key={t.id}
                      onClick={() => advanceTask(t.id)}
                      className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer transition-all mb-1.5"
                    >
                      <div className="font-semibold text-amber-300 text-[11px]">{t.title}</div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase">{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipped / Done */}
              <div className="bg-background/80 border border-border/70 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center justify-between">
                    <span>Shipped</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  {kanbanTasks.filter(t => t.status === 'done').map(t => (
                    <div 
                      key={t.id}
                      onClick={() => advanceTask(t.id)}
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer transition-all mb-1.5"
                    >
                      <div className="font-semibold text-emerald-300 text-[11px]">{t.title}</div>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase">{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Interactive Simulator</span>
              <span className="text-primary font-semibold flex items-center gap-1 cursor-pointer">
                Click cards to advance <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PILLAR 5: VERIFIED UNIVERSITY IDENTITY PASS (FULL WIDTH)       */}
          {/* (Spans 12 columns on desktop for institutional credibility) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:col-span-12 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-primary/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-primary mb-1">
                  Pillar 05 • Institutional Trust
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Verified Academic Identity & Zero-Trust Row Level Security
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                  Every squad member is authenticated via institutional domains (<code className="text-primary font-mono">@buet.ac.bd</code>, <code className="text-primary font-mono">@du.ac.bd</code>, <code className="text-primary font-mono">@sust.edu</code>). Intellectual property is strictly safeguarded with PostgreSQL RLS.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-background border border-border/80 text-xs font-mono font-semibold text-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                16 RLS Shields Active
              </div>
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-1.5"
              >
                Create Free Student Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
