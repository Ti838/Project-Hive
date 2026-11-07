'use client';

import Link from 'next/link';
import { Layers, UserCheck, Users, Video, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';

const LIFECYCLE_STAGES = [
  {
    step: '01',
    title: 'Verified Student Identity',
    subtitle: 'Campus Verification & Skills',
    icon: UserCheck,
    color: 'from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/30 text-blue-400',
    description:
      'Authenticate with your university email, list your verified programming competencies, and link external GitHub & LeetCode profiles for instant academic credibility.',
    capabilities: [
      'Institutional email verification',
      'Verified tech stack badges',
      'GitHub repository & LeetCode link integration'
    ]
  },
  {
    step: '02',
    title: 'Skill-Based Matchmaking',
    subtitle: 'Squad Recruitment & Approvals',
    icon: Users,
    color: 'from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/30 text-violet-400',
    description:
      'Browse active university project squads seeking complementary disciplines. Apply with one click and let squad leads review candidate profiles in real-time approval drawers.',
    capabilities: [
      'Filter by capstone tracks & technical stacks',
      'Squad roster management & open role listings',
      'One-click application & approval workflow'
    ]
  },
  {
    step: '03',
    title: 'Real-Time Incubation',
    subtitle: 'SFU Calling & AI Copilot',
    icon: Video,
    color: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 text-amber-400',
    description:
      'Hop into low-latency LiveKit SFU 4K video calls, collaborate in dedicated Socket.IO squad channels with audio notification chimes, and scaffold sprint specs with HiveMind AI.',
    capabilities: [
      'LiveKit SFU 4K calling with spatial audio',
      'Persistent squad chat & live notification sound chimes',
      'HiveMind AI sprint PRDs & architecture generator'
    ]
  },
  {
    step: '04',
    title: 'Verified Capstone Showcase',
    subtitle: 'Public Portfolio & Mentorship',
    icon: Trophy,
    color: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-400',
    description:
      'Publish your completed project build to the university showcase with live deployment links, verified GitHub repo turn-in badges, and team contributor attributions.',
    capabilities: [
      'Public showcase discoverable by peers & mentors',
      'Live demo & source repository turn-in links',
      'Immutable contributor credits & peer endorsements'
    ]
  }
];

export function Testimonials() {
  return (
    <section className="w-full py-24 sm:py-28 px-4 sm:px-6 lg:px-12 bg-background relative overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            End-to-End Collaboration Architecture
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
            How University Squads Build on{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
              ProjectHive
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            A deterministic four-stage platform lifecycle designed to take academic projects from initial team recruitment to verified capstone publication.
          </p>
        </div>

        {/* Lifecycle Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LIFECYCLE_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Top Bar with Step & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono font-bold text-muted-foreground/80 bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                      STAGE {stage.step}
                    </span>
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stage.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {stage.title}
                  </h3>
                  <div className="text-xs font-semibold text-primary/90 mt-0.5 mb-3">
                    {stage.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    {stage.description}
                  </p>
                </div>

                {/* Capabilities list */}
                <div className="pt-4 border-t border-border/60 space-y-2">
                  {stage.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:underline group"
          >
            <span>Explore Active University Squads</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
