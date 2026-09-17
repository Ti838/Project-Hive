'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Terminal } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function CTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom bottom',
        toggleActions: 'play none none reverse'
      }
    });

    // Initial states
    gsap.set(visualRef.current, { scale: 0.8, opacity: 0 });
    gsap.set(contentRef.current, { y: 50, opacity: 0 });
    gsap.set(ctaButtonsRef.current, { y: 30, opacity: 0 });

    // 1. Visual slowly forms (ambient ring/depth)
    tl.to(visualRef.current, {
      scale: 1,
      opacity: 0.15,
      duration: 2,
      ease: 'power2.out'
    })
    // 2. Content reveals
    .to(contentRef.current, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out'
    }, '-=1.5')
    // 3. CTAs appear
    .to(ctaButtonsRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.8');

    // 4. Subtle ambient animation continues infinitely
    gsap.to(visualRef.current, {
      rotation: 360,
      duration: 60,
      repeat: -1,
      ease: 'linear'
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === containerRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full min-h-[80vh] flex items-center justify-center bg-background overflow-hidden border-t border-foreground/5 pb-24"
    >
      {/* Visual Element Slowly Forming */}
      <div 
        ref={visualRef}
        className="absolute inset-0 m-auto w-[600px] h-[600px] pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full border border-foreground/20" />
        <div className="absolute inset-4 rounded-full border border-foreground/10 border-dashed" />
        <div className="absolute inset-12 rounded-full border border-foreground/5" />
        {/* Subtle gradient wash, no excessive glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        
        <div ref={contentRef} className="flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6">
            Stop searching.<br />
            <span className="text-foreground/60">Start shipping.</span>
          </h2>
          
          <p className="text-xl text-foreground/50 max-w-xl mx-auto mb-12 font-medium">
            Join the next generation of student developers building their capstones, hackathons, and startups on ProjectHive.
          </p>
        </div>

        <div ref={ctaButtonsRef} className="flex flex-col sm:flex-row items-center gap-4">
          <button className="h-14 px-8 rounded-full bg-foreground text-background font-semibold text-base flex items-center gap-2 hover:bg-foreground/90 transition-transform hover:scale-105 active:scale-95 group">
            Create Your Profile
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="h-14 px-8 rounded-full bg-foreground/5 text-foreground font-semibold text-base flex items-center gap-2 hover:bg-foreground/10 transition-colors border border-foreground/10">
            <Terminal className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

      </div>
    </section>
  );
}

