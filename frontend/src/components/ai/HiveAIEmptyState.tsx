'use client';
// ─── Hive AI Empty & Error State Components ─────────────────────────────────

import { Sparkles, Lightbulb, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

interface HiveAIEmptyStateProps {
  capability: HiveAICapabilityType;
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
}

const CAPABILITY_SUGGESTIONS: Record<HiveAICapabilityType, { title: string; desc: string; prompts: string[] }> = {
  project_generator: {
    title: 'Generate an Engineering Project Blueprint',
    desc: 'Input your domain, preferred tech stack, and timeline to receive complete architecture specs, milestones, and DB schema.',
    prompts: [
      'Build a real-time collaborative whiteboard with Next.js, WebSockets, and Canvas API',
      'Create an AI-powered resume analyzer for student campus job fairs',
      'Develop a decentralized peer-to-peer textbook and gadget rental marketplace',
    ],
  },
  idea_analyzer: {
    title: 'Analyze & Score a Project Concept',
    desc: 'Evaluate product-market fit, technical feasibility, innovation rating, and edge-case risks.',
    prompts: [
      'Analyze feasibility: IoT smart campus parking sensor system with Raspberry Pi and MQTT',
      'Evaluate market viability: Cross-university hackathon team matchmaking platform',
    ],
  },
  project_critic: {
    title: 'Rigorous Code & Architectural Critique',
    desc: 'Uncover vulnerabilities, missing validation layers, and scalability bottlenecks before demo day.',
    prompts: [
      'Review my Next.js + Express API architecture for rate limiting & SQL injection risks',
      'Audit our LiveKit SFU video calling integration for audio packet drops and reconnection logic',
    ],
  },
  research_assistant: {
    title: 'Technical Investigation & Comparison',
    desc: 'Synthesize deep trade-off matrices, benchmarks, and production best practices.',
    prompts: [
      'Compare PostgreSQL + Supabase vs MongoDB for real-time messaging workloads',
      'Deep dive: WebRTC SFU vs P2P mesh architectures for 10+ participant calls',
    ],
  },
  documentation_ai: {
    title: 'Generate Production Documentation',
    desc: 'Create comprehensive GitHub READMEs, OpenAPI tables, and deployment checklists.',
    prompts: [
      'Generate a full GitHub README.md for a full-stack Next.js + Supabase application',
      'Draft an API documentation table with JWT auth headers, error codes, and curl examples',
    ],
  },
  code_assistant: {
    title: 'Debug Code & Generate Tests',
    desc: 'Diagnose runtime errors, refactor complex TypeScript logic, and write unit tests.',
    prompts: [
      'Debug this React 19 useEffect stale closure issue with WebSocket subscriptions',
      'Write Jest unit tests for JWT token verification and token refresh middleware',
    ],
  },
  architecture_design: {
    title: 'System Design & ER Modeling',
    desc: 'Map out cloud topologies, database normalization, and caching strategies.',
    prompts: [
      'Design a resilient Redis + Socket.IO clustering topology for horizontal scaling',
      'Draft a normalized PostgreSQL schema with UUIDs, foreign keys, and RLS for team squads',
    ],
  },
  project_health: {
    title: 'Audit Project Health & Blockers',
    desc: 'Identify sprint bottlenecks, missing test suites, and delivery trajectory.',
    prompts: [
      'Assess our 4-week hackathon delivery timeline for missing critical path deliverables',
    ],
  },
  team_ai: {
    title: 'Team Composition & Skill Gap Analysis',
    desc: 'Analyze required engineering roles, balance workloads, and discover needed skills.',
    prompts: [
      'Analyze skill gaps for a 4-person team building a Flutter mobile app with Supabase backend',
    ],
  },
  career_ai: {
    title: 'Elevate Your Technical Portfolio',
    desc: 'Convert student hackathon builds into high-converting YC pitches and STAR-format resume bullets.',
    prompts: [
      'Draft a 30-second elevator pitch and 3 resume bullet points for my ProjectHive application',
    ],
  },
  copilot_chat: {
    title: 'Multimodal Engineering Copilot',
    desc: 'Ask technical questions, paste screenshots (Ctrl+V) or code snippets for instant pair-programming.',
    prompts: [
      'How do I safely configure CORS and SameSite cookies across ports 3000 and 5000?',
      'Explain the difference between optimistic UI updates and server-revalidation in Next.js',
    ],
  },
};

export function HiveAIEmptyState({
  capability,
  onSelectPrompt,
  className,
}: HiveAIEmptyStateProps) {
  const current = CAPABILITY_SUGGESTIONS[capability] || CAPABILITY_SUGGESTIONS.copilot_chat;

  return (
    <div className={cn('py-8 sm:py-12 px-4 max-w-2xl mx-auto text-center space-y-6 select-none', className)}>
      <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
          {current.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {current.desc}
        </p>
      </div>

      {current.prompts.length > 0 && onSelectPrompt && (
        <div className="space-y-2 pt-2 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
            Suggested Prompts:
          </p>
          <div className="space-y-2">
            {current.prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(p)}
                className="w-full p-3 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:bg-accent/50 text-xs font-medium text-foreground flex items-center justify-between gap-3 transition-all tap-press group text-left shadow-xs"
              >
                <span className="line-clamp-2">{p}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HiveAIError({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2.5 text-xs font-medium">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{message || 'Hive AI service encountered a temporary error. Please retry.'}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors shrink-0 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
