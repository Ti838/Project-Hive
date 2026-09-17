'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { User, Cpu, Code2, Globe, Users, Video } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WORKFLOW_STEPS = [
  {
    id: 'user',
    icon: User,
    title: 'Student Identity',
    desc: 'Input your university, tech stack, and experience.',
    align: 'right'
  },
  {
    id: 'platform',
    icon: Cpu,
    title: 'AI Matchmaking',
    desc: 'The platform algorithms pair you with complementary skill sets.',
    align: 'left'
  },
  {
    id: 'process',
    icon: Code2,
    title: 'Live Collaboration',
    desc: 'Build together using WebRTC rooms and unified code environments.',
    align: 'right'
  },
  {
    id: 'outcome',
    icon: Globe,
    title: 'Global Release',
    desc: 'Publish your capstone project to the community portfolio showcase.',
    align: 'left'
  }
];

export function Workflow() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineProgressRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // 1. Line drawing animation
    gsap.fromTo(
      lineProgressRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: true,
        }
      }
    );

    // 2. Node activation & Text reveal
    nodesRef.current.forEach((node, index) => {
      if (!node) return;
      const content = contentRefs.current[index];
      const isRight = WORKFLOW_STEPS[index].align === 'right';

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: 'top center+=10%', // Activates just as the line reaches it
          end: 'bottom center',
          toggleActions: 'play none none reverse'
        }
      });

      // Node dot activation
      tl.fromTo(
        node,
        { scale: 0.5, opacity: 0.3, borderColor: 'rgba(255,255,255,0.1)' },
        { scale: 1, opacity: 1, borderColor: 'hsl(var(--primary))', duration: 0.5, ease: 'back.out(2)' }
      );

      // Icon pop
      tl.fromTo(
        node.querySelector('svg'),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' },
        '-=0.3'
      );

      if (content) {
        // Text and visual reveal
        tl.fromTo(
          content,
          { 
            opacity: 0, 
            x: isRight ? -40 : 40,
            filter: 'blur(8px)'
          },
          { 
            opacity: 1, 
            x: 0, 
            filter: 'blur(0px)',
            duration: 0.8, 
            ease: 'power3.out' 
          },
          '-=0.4'
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === sectionRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen py-32 overflow-hidden bg-background"
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-32">
          <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-primary mb-4">
            How It Works
          </h2>
          <h3 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
            The Collaboration Pipeline
          </h3>
        </div>

        {/* Workflow Container */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Background Line */}
          <div className="absolute top-0 bottom-0 left-[24px] md:left-1/2 md:-translate-x-1/2 w-px bg-foreground/10" />
          
          {/* Animated Progress Line */}
          <div 
            ref={lineProgressRef}
            className="absolute top-0 bottom-0 left-[24px] md:left-1/2 md:-translate-x-1/2 w-px bg-primary origin-top shadow-[0_0_15px_var(--primary)] z-10" 
          />

          {/* Steps */}
          <div className="w-full flex flex-col gap-24 md:gap-40 py-10">
            {WORKFLOW_STEPS.map((step, i) => (
              <div 
                key={step.id} 
                className="relative w-full flex items-center"
              >
                {/* Node Dot (Positioned exactly on the line) */}
                <div 
                  ref={el => { nodesRef.current[i] = el; }}
                  className="absolute left-0 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-2 border-foreground/10 z-20 flex items-center justify-center shadow-elevated"
                >
                  <div className="absolute inset-0 bg-primary/10 rounded-full" />
                  <step.icon className="w-5 h-5 text-primary relative z-10" />
                </div>

                {/* Content Block */}
                <div 
                  className={`w-full pl-20 md:pl-0 md:w-1/2 ${
                    step.align === 'left' ? 'md:pr-16 md:text-right md:mr-auto' : 'md:pl-16 md:text-left md:ml-auto'
                  }`}
                >
                  <div 
                    ref={el => { contentRefs.current[i] = el; }}
                    className="flex flex-col gap-3"
                  >
                    <div className="text-primary font-mono text-xs tracking-widest font-semibold uppercase">
                      Phase 0{i + 1}
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-base text-foreground/60 leading-relaxed text-balance">
                      {step.desc}
                    </p>
                    
                    {/* Visual Element attached to the step */}
                    <div className={`mt-6 h-32 rounded-2xl bg-foreground/5 border border-foreground/10 relative overflow-hidden flex items-center p-6 backdrop-blur-md ${step.align === 'left' ? 'md:justify-end' : 'justify-start'}`}>
                      {i === 0 && (
                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-full bg-foreground/10" />
                          <div className="flex flex-col gap-2">
                            <div className="h-3 w-20 bg-foreground/20 rounded" />
                            <div className="h-2 w-32 bg-foreground/10 rounded" />
                          </div>
                        </div>
                      )}
                      {i === 1 && (
                        <div className="flex gap-6 items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="h-[1px] w-12 bg-foreground/20 relative">
                            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-ping" />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-400" />
                          </div>
                        </div>
                      )}
                      {i === 2 && (
                        <div className="w-full flex items-center gap-4">
                          <div className="flex-1 h-16 border border-foreground/10 rounded-lg bg-card/50 flex flex-col p-2 gap-1.5">
                            <div className="w-1/2 h-1.5 bg-emerald-500/40 rounded" />
                            <div className="w-3/4 h-1.5 bg-emerald-500/20 rounded" />
                          </div>
                          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <Video className="w-5 h-5 text-red-400" />
                          </div>
                        </div>
                      )}
                      {i === 3 && (
                        <div className="w-full h-full flex flex-col justify-end">
                          <div className="w-full h-4/5 rounded-t-xl bg-gradient-to-t from-emerald-500/20 to-transparent border-t border-x border-emerald-500/30" />
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

