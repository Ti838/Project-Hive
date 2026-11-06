'use client';

import { Star, Quote, GraduationCap, CheckCircle2 } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Ayesha Rahman',
    role: 'Lead ML Researcher',
    university: 'BUET · Dept. of CSE',
    project: 'Autonomous Medical Diagnostic Drone',
    avatar: 'AR',
    color: 'from-blue-500 to-indigo-600',
    stars: 5,
    quote:
      'Finding hardware and firmware engineers for our final year design project was an absolute nightmare until ProjectHive. Within 48 hours, we recruited two embedded engineers and a backend developer. We won 1st place in the National Capstone Expo!'
  },
  {
    name: 'Marcus Vance',
    role: 'Full-Stack Developer',
    university: 'UC Berkeley · EECS',
    project: 'Decentralized Energy Grid Simulator',
    avatar: 'MV',
    color: 'from-violet-500 to-purple-600',
    stars: 5,
    quote:
      'The built-in LiveKit WebRTC call dock and sprint Kanban completely eliminated Discord and Slack for us. We were able to live-code together with zero lag, screen share our React terminals, and submit on time.'
  },
  {
    name: 'Tanvir Ahmed',
    role: 'Robotics & AI Enthusiast',
    university: 'IUT · Dept. of CSE',
    project: 'Subsea Autonomous Exploration ROV',
    avatar: 'TA',
    color: 'from-emerald-500 to-teal-600',
    stars: 5,
    quote:
      'HiveMind AI generated our initial ROS 2 architecture breakdown in 30 seconds. Being able to showcase our live demo directly on the ProjectHive Showcase got our squad noticed by three startup accelerators.'
  }
];

export function Testimonials() {
  return (
    <section className="w-full py-28 px-6 sm:px-12 bg-background relative overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            Verified Campus Proof
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl leading-tight">
            Built by students, for the teams{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
              shaping tomorrow
            </span>
            .
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
            See how engineering students and faculty mentors use ProjectHive to transform raw coursework into award-winning software and hardware.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative group shadow-sm hover:shadow-md"
            >
              <div>
                {/* Rating Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                </div>

                {/* Quote Content */}
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-normal mb-6">
                  "{t.quote}"
                </p>
              </div>

              {/* Author & Project info */}
              <div className="pt-6 border-t border-border/60">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {t.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">{t.role} · {t.university}</p>
                  </div>
                </div>

                <div className="mt-3 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Project:</span> {t.project}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partner Logos or Universities banner */}
        <div className="mt-16 pt-12 border-t border-border/40 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Trusted by student innovators from premier global institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 text-sm font-bold tracking-tight text-foreground/80">
            <span>BUET</span>
            <span>·</span>
            <span>UC BERKELEY</span>
            <span>·</span>
            <span>STANFORD</span>
            <span>·</span>
            <span>IUT</span>
            <span>·</span>
            <span>NUS SINGAPORE</span>
            <span>·</span>
            <span>TORONTO TECH</span>
          </div>
        </div>
      </div>
    </section>
  );
}

