'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Video, Mic, Share2, Code2, Users, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function ProductStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation Refs
  const headerGroupRef = useRef<HTMLDivElement>(null);
  const visualContainerRef = useRef<HTMLDivElement>(null);
  const mockupMainRef = useRef<HTMLDivElement>(null);
  const mockupFloat1Ref = useRef<HTMLDivElement>(null);
  const mockupFloat2Ref = useRef<HTMLDivElement>(null);
  const supportingGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Enter viewport animation sequence
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
        end: 'bottom bottom',
        toggleActions: 'play none none reverse',
      }
    });

    // Reset states
    gsap.set([headerGroupRef.current, supportingGroupRef.current], { opacity: 0, y: 40 });
    gsap.set(mockupMainRef.current, { opacity: 0, y: 100, rotateX: 15, scale: 0.95 });
    gsap.set([mockupFloat1Ref.current, mockupFloat2Ref.current], { opacity: 0, y: 50, scale: 0.8 });

    tl.to(headerGroupRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    })
    .to(mockupMainRef.current, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      duration: 1.2,
      ease: 'expo.out'
    }, '-=0.6')
    .to(mockupFloat1Ref.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
      ease: 'back.out(1.5)'
    }, '-=0.8')
    .to(mockupFloat2Ref.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
      ease: 'back.out(1.5)'
    }, '-=0.8')
    .to(supportingGroupRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.6');

    // 2. Parallax and continuous scroll depth
    gsap.to(mockupMainRef.current, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: visualContainerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
    
    gsap.to(mockupFloat1Ref.current, {
      y: -120, // Moves faster for depth
      ease: 'none',
      scrollTrigger: {
        trigger: visualContainerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });

    gsap.to(mockupFloat2Ref.current, {
      y: -30, // Moves slower
      ease: 'none',
      scrollTrigger: {
        trigger: visualContainerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });

    // 3. Mouse Parallax specifically for the visual group
    const handleMouseMove = (e: MouseEvent) => {
      if (!visualContainerRef.current) return;
      
      const { left, top, width, height } = visualContainerRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      // Calculate normalized mouse distance from center of visual
      const moveX = (e.clientX - centerX) / width;
      const moveY = (e.clientY - centerY) / height;

      gsap.to(mockupMainRef.current, {
        rotationY: moveX * 4,
        rotationX: -moveY * 4,
        duration: 1,
        ease: 'power2.out'
      });

      gsap.to(mockupFloat1Ref.current, {
        x: moveX * 20,
        y: moveY * 20,
        duration: 1.5,
        ease: 'power2.out'
      });

      gsap.to(mockupFloat2Ref.current, {
        x: moveX * -15,
        y: moveY * -15,
        duration: 1.5,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={containerRef}
      id="how-it-works"
      className="relative z-20 min-h-screen w-full flex flex-col items-center justify-center py-32 px-6 sm:px-12 bg-background border-t border-foreground/5"
    >
      {/* 1. Header Area */}
      <div ref={headerGroupRef} className="max-w-[1200px] w-full mx-auto text-center space-y-6 mb-20 md:mb-32 z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
          The hub where ideas <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-primary bg-clip-text text-transparent">
            become reality.
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto text-balance">
          ProjectHive eliminates the friction of team coordination. Code, chat, call, and review in a unified interface designed specifically for student developers.
        </p>
      </div>

      {/* 2. Interactive Product Visual */}
      <div 
        ref={visualContainerRef}
        className="relative w-full max-w-[1200px] mx-auto perspective-[1200px] mb-24 h-[500px] md:h-[650px]"
      >
        {/* Glow behind the interface */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-3xl rounded-full opacity-60 pointer-events-none" />

        {/* Main Interface Mockup */}
        <div 
          ref={mockupMainRef}
          className="absolute inset-0 mx-auto w-full md:w-10/12 h-full rounded-2xl bg-card border border-foreground/10 shadow-elevated overflow-hidden flex flex-col"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Mockup Header */}
          <div className="h-12 border-b border-foreground/10 flex items-center px-4 gap-3 bg-foreground/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto px-6 py-1 rounded-md bg-foreground/5 text-xs text-foreground/50 font-mono tracking-wide">
              ProjectHive Studio
            </div>
          </div>

          {/* Mockup Body (Rebuilt for mobile: stack vertically, desktop: side-by-side) */}
          <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 bg-[url('/noise.png')] bg-repeat">
            {/* Left Sidebar (Code/Tasks) */}
            <div className="flex flex-col md:w-1/3 gap-4">
              <div className="flex-1 rounded-xl bg-background/50 border border-foreground/5 p-4 flex flex-col gap-3 min-h-[120px]">
                <div className="flex items-center gap-2 text-sm text-foreground/70 font-semibold">
                  <Code2 className="w-4 h-4" /> index.ts
                </div>
                <div className="flex-1 space-y-2 opacity-50">
                  <div className="h-2 w-3/4 bg-foreground/10 rounded" />
                  <div className="h-2 w-1/2 bg-foreground/10 rounded" />
                  <div className="h-2 w-full bg-foreground/10 rounded" />
                </div>
              </div>
              <div className="h-24 md:h-32 rounded-xl bg-background/50 border border-foreground/5 p-4 hidden sm:block">
                <div className="text-xs text-foreground/50 mb-3 uppercase tracking-widest font-bold">Active Squad</div>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card shadow-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Stage (Video/Collab) */}
            <div className="flex-1 rounded-xl bg-background/50 border border-foreground/5 relative overflow-hidden group min-h-[160px]">
              {/* Fake Video Call Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-foreground/10 shadow-[0_0_20px_var(--primary)]">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Live WebRTC Session</span>
                </div>
              </div>

              {/* In-Call Actions */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-foreground/10 opacity-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/80 hover:bg-foreground/20 transition-colors"><Mic className="w-4 h-4" /></button>
                <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/80 hover:bg-foreground/20 transition-colors"><Video className="w-4 h-4" /></button>
                <button className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-foreground transition-colors"><Share2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements for Parallax Depth */}
        <div 
          ref={mockupFloat1Ref}
          className="absolute -right-4 md:-right-12 top-1/4 w-48 md:w-64 rounded-xl bg-card border border-foreground/10 shadow-elevated p-4 backdrop-blur-md z-20"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold">New Member</div>
              <div className="text-xs text-foreground/50">Sarah joined the squad</div>
            </div>
          </div>
          <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-full" />
          </div>
        </div>

        <div 
          ref={mockupFloat2Ref}
          className="absolute -left-4 md:-left-8 bottom-1/4 w-40 md:w-56 rounded-xl bg-card border border-foreground/10 shadow-elevated p-4 backdrop-blur-md z-20"
          style={{ transform: 'translateZ(100px)' }}
        >
          <div className="text-xs text-foreground/50 uppercase tracking-widest font-bold mb-2">Hive AI Check</div>
          <div className="text-sm font-medium mb-1">Architecture looks good.</div>
          <div className="flex items-center gap-1.5 text-primary text-xs mt-3">
            Review recommendations <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 3. Supporting Information */}
      <div ref={supportingGroupRef} className="max-w-[1200px] w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left z-10 px-4">
        {[
          { title: 'Unified Interface', desc: 'No more switching between Discord, Zoom, and VS Code. Do it all in one cohesive environment.' },
          { title: 'Always Synchronized', desc: 'Real-time WebRTC connections mean your team is never out of the loop. See code edits as they happen.' },
          { title: 'Built for Flow', desc: 'A minimal, distraction-free environment that puts your project architecture and team communication front and center.' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col gap-3 group">
            <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{item.title}</h4>
            <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

    </section>
  );
}

