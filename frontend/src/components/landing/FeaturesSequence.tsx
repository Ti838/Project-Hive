'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Video, Sparkles, FolderKanban } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    id: 'matchmaking',
    title: 'Intelligent Matchmaking',
    desc: 'Filter potential teammates by tech skills, university, and experience level. Send squad invitations with 1-click.',
    label: '01 / SQUADS',
    icon: Users,
    color: 'from-blue-500/20 to-indigo-500/5'
  },
  {
    id: 'webrtc',
    title: 'Real-Time HD Calls',
    desc: 'Integrated WebRTC rooms for instant team standups, screen-sharing code reviews, and live whiteboard brainstorming.',
    label: '02 / COLLAB',
    icon: Video,
    color: 'from-violet-500/20 to-purple-500/5'
  },
  {
    id: 'ai',
    title: 'Neural AI Copilot',
    desc: 'Harness ProjectHive AI to generate project roadmaps, tech stack recommendations, and milestone plans in seconds.',
    label: '03 / STUDIO',
    icon: Sparkles,
    color: 'from-amber-500/20 to-orange-500/5'
  },
  {
    id: 'showcase',
    title: 'Project Showcase',
    desc: 'Publish your capstone builds with live demo links, repository badges, and receive constructive feedback from peers.',
    label: '04 / PORTFOLIO',
    icon: FolderKanban,
    color: 'from-emerald-500/20 to-teal-500/5'
  }
];

export function FeaturesSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  
  // Refs for the individual visuals on the right
  const visualRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Refs for the text blocks on the left
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Setup ScrollTrigger for pinning the right column on desktop
    // We only want to pin the visuals while the text scrolls
    
    // We will crossfade and scale visuals based on which text block is active
    textRefs.current.forEach((textEl, index) => {
      if (!textEl) return;
      const visualEl = visualRefs.current[index];
      if (!visualEl) return;

      // Animate the text block itself
      gsap.fromTo(
        textEl,
        { opacity: 0.2, filter: 'blur(4px)', x: -20 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          x: 0,
          scrollTrigger: {
            trigger: textEl,
            start: 'top center+=10%',
            end: 'center center',
            scrub: true,
          }
        }
      );

      gsap.to(textEl, {
        opacity: 0.1,
        filter: 'blur(4px)',
        x: 0,
        scrollTrigger: {
          trigger: textEl,
          start: 'bottom center',
          end: 'bottom center-=20%',
          scrub: true,
        }
      });

      // Animate the corresponding visual
      const isFirst = index === 0;
      
      gsap.fromTo(
        visualEl,
        { 
          opacity: isFirst ? 1 : 0, 
          scale: isFirst ? 1 : 0.8,
          y: isFirst ? 0 : 50,
          rotateX: isFirst ? 0 : -10
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: textEl,
            start: 'top center+=20%',
            end: 'center center',
            scrub: true,
          }
        }
      );
      
      // Fade out when scrolling past
      gsap.to(visualEl, {
        opacity: 0,
        scale: 1.1,
        y: -50,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: textEl,
          start: 'bottom center',
          end: 'bottom center-=20%',
          scrub: true,
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-background z-20">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row px-6 sm:px-12 relative">
        
        {/* LEFT COLUMN: Scrollable Text Blocks */}
        <div ref={leftColRef} className="w-full md:w-5/12 flex flex-col z-20 pb-[50vh]">
          {FEATURES.map((feature, i) => (
            <div 
              key={feature.id}
              ref={el => { textRefs.current[i] = el; }}
              className="h-[70vh] md:h-screen flex flex-col justify-center max-w-md mx-auto md:mx-0"
            >
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-mono tracking-widest text-foreground/50">
                {feature.label}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
                {feature.title}
              </h2>
              <p className="text-lg text-foreground/60 leading-relaxed text-balance">
                {feature.desc}
              </p>
              
              {/* Mobile Visual (Visible only on small screens, interleaves with text) */}
              <div className="mt-8 md:hidden h-[40vh] w-full rounded-3xl bg-card border border-foreground/5 relative overflow-hidden flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-40`} />
                <div className="m-auto flex flex-col items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-background/50 border border-foreground/10 backdrop-blur-md flex items-center justify-center shadow-elevated">
                    <feature.icon className="w-8 h-8 text-foreground/80" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Pinned Visuals (Desktop Only) */}
        <div ref={rightColRef} className="hidden md:flex w-7/12 h-screen sticky top-0 items-center justify-center p-12">
          <div className="relative w-full h-[70%] max-w-3xl rounded-[2rem] border border-foreground/5 bg-background/50 backdrop-blur-2xl overflow-hidden shadow-elevated perspective-[1000px]">
            
            {/* Visual 1: Matchmaking */}
            <div ref={el => { visualRefs.current[0] = el; }} className="absolute inset-0 p-8 flex items-center justify-center">
              <div className={`absolute inset-0 bg-gradient-to-br ${FEATURES[0].color} opacity-20`} />
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-32 rounded-xl bg-card border border-foreground/10 shadow-elevated -rotate-6 translate-x-4 animate-bounce-subtle" />
                  <div className="w-28 h-36 rounded-xl bg-card border border-foreground/20 shadow-[0_0_30px_rgba(59,130,246,0.2)] z-10 flex flex-col p-3">
                    <div className="w-12 h-12 rounded-full bg-foreground/10 mx-auto mb-3" />
                    <div className="h-2 w-3/4 bg-foreground/20 rounded mx-auto mb-2" />
                    <div className="h-2 w-1/2 bg-foreground/10 rounded mx-auto" />
                  </div>
                  <div className="w-24 h-32 rounded-xl bg-card border border-foreground/10 shadow-elevated rotate-6 -translate-x-4" />
                </div>
                <div className="px-6 py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/30">
                  98% Match
                </div>
              </div>
            </div>

            {/* Visual 2: WebRTC */}
            <div ref={el => { visualRefs.current[1] = el; }} className="absolute inset-0 p-8 flex items-center justify-center">
              <div className={`absolute inset-0 bg-gradient-to-br ${FEATURES[1].color} opacity-20`} />
              <div className="relative w-full h-full flex flex-col gap-4">
                <div className="flex-1 rounded-2xl bg-card border border-foreground/10 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-purple-500/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-purple-500/50 animate-ping" style={{ animationDuration: '3s' }} />
                      <Video className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 h-1/3">
                  <div className="flex-1 rounded-xl bg-card border border-foreground/10" />
                  <div className="flex-1 rounded-xl bg-card border border-foreground/10" />
                </div>
              </div>
            </div>

            {/* Visual 3: AI Copilot */}
            <div ref={el => { visualRefs.current[2] = el; }} className="absolute inset-0 p-8 flex items-center justify-center">
              <div className={`absolute inset-0 bg-gradient-to-br ${FEATURES[2].color} opacity-20`} />
              <div className="relative w-full h-full rounded-2xl bg-background border border-foreground/10 p-6 font-mono text-sm flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500/80">HiveAI Architect</span>
                </div>
                <div className="space-y-3 text-foreground/50">
                  <div><span className="text-blue-400">const</span> <span className="text-amber-300">stack</span> = {'{'}</div>
                  <div className="pl-4">frontend: <span className="text-emerald-400">'Next.js'</span>,</div>
                  <div className="pl-4">database: <span className="text-emerald-400">'PostgreSQL'</span>,</div>
                  <div className="pl-4">realtime: <span className="text-emerald-400">'WebRTC'</span></div>
                  <div>{'}'};</div>
                  <div className="mt-4 animate-pulse w-2 h-4 bg-foreground/50" />
                </div>
              </div>
            </div>

            {/* Visual 4: Showcase */}
            <div ref={el => { visualRefs.current[3] = el; }} className="absolute inset-0 p-8 flex items-center justify-center">
              <div className={`absolute inset-0 bg-gradient-to-br ${FEATURES[3].color} opacity-20`} />
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Spotlight effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-full bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl rounded-full" />
                
                <div className="relative w-3/4 aspect-video rounded-xl bg-card border border-foreground/20 shadow-[0_20px_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden group">
                  <div className="h-10 bg-foreground/5 border-b border-foreground/10 flex items-center px-4 gap-2">
                    <div className="w-2 h-2 rounded-full bg-foreground/20" />
                    <div className="w-2 h-2 rounded-full bg-foreground/20" />
                    <div className="w-2 h-2 rounded-full bg-foreground/20" />
                  </div>
                  <div className="flex-1 p-6 flex flex-col items-center justify-center">
                    <FolderKanban className="w-12 h-12 text-emerald-400 mb-4" />
                    <div className="text-lg font-bold text-foreground mb-2">Project Deployed</div>
                    <div className="h-1 w-24 bg-emerald-500/50 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

