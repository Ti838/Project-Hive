'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, Shield, Users, Terminal } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative w-full py-28 sm:py-36 flex items-center justify-center bg-background overflow-hidden border-t border-border/40">
      {/* Dynamic Background Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
      
      {/* Decorative ambient circular borders */}
      <div className="absolute inset-0 m-auto w-[650px] h-[650px] pointer-events-none flex items-center justify-center -z-10">
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-[spin_120s_linear_infinite]" />
        <div className="absolute inset-16 rounded-full border border-primary/5 border-dashed animate-[spin_80s_linear_infinite_reverse]" />
        <div className="absolute inset-32 rounded-full border border-primary/10" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        
        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Join +2,400 students building the future of software</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
          Stop searching alone.<br />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
            Build with your squad.
          </span>
        </h2>
        
        {/* Subhead */}
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          From first commit to final presentation. Connect with skilled teammates, ideate with HiveMind AI, and showcase your capstone to top tech companies.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
          <Link 
            href="/register"
            className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-foreground text-background font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/10 group"
          >
            Deploy Your Squad Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/showcase"
            className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-card border border-border/80 text-foreground font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-muted/60 transition-all hover:border-border shadow-xs"
          >
            Explore Student Showcase
          </Link>
        </div>

        {/* Feature Checkmarks Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-muted-foreground pt-4 border-t border-border/60 w-full max-w-2xl">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Forever for Students
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4 text-primary" /> Verified University IDs
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Terminal className="w-4 h-4 text-accent" /> LiveKit 4K Streaming
          </span>
        </div>

      </div>
    </section>
  );
}
