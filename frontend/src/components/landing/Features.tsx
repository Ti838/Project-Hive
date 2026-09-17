'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Video, Sparkles, FolderKanban } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { label: 'Real-Time WebRTC Calls', icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { label: 'Neural AI Studio', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Intelligent Matchmaking', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Live Showcase Portfolio', icon: FolderKanban, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // ScrollTrigger for the section background/depth
    gsap.fromTo(
      sectionRef.current,
      { opacity: 0, scale: 0.95, y: 100 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom', // Start when the top of the section hits the bottom of the viewport
          end: 'top center', // End when the top hits the center
          scrub: true,
        },
      }
    );

    // ScrollTrigger for the header text
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: true,
        },
      }
    );

    // Staggered ScrollTrigger for the feature cards
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(
        card,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'top 20%',
            scrub: 1, // Add slight lag for a smoother, floaty feeling
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === sectionRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="features" 
      className="relative z-20 min-h-screen w-full flex flex-col items-center justify-center pt-24 pb-32 px-6 sm:px-12 bg-background/50 backdrop-blur-3xl border-t border-foreground/5 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center z-10">
        
        <div ref={headerRef} className="text-center max-w-3xl mb-24 space-y-6">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">Capabilities</span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance leading-tight">
            Everything you need to <span className="text-foreground/50">collaborate & succeed.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {FEATURES.map((feature, i) => (
            <div 
              key={feature.label}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="relative overflow-hidden group p-8 rounded-3xl bg-foreground/5 border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/10 transition-colors backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 border border-foreground/5`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-bold mb-3">{feature.label}</h3>
              <div className="w-8 h-1 bg-foreground/20 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


