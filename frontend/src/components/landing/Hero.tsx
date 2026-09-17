'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Main Hero Component
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Elements refs for GSAP Timeline
  const bgVisualRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const mainVisualRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  
  // Parallax ref
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Setup Master GSAP Timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Initial states (hide everything before timeline starts)
    gsap.set([
      bgVisualRef.current, particlesRef.current, mainVisualRef.current,
      labelRef.current, headlineRef.current, sublineRef.current,
      ctaRef.current, scrollIndicatorRef.current
    ], { autoAlpha: 0, y: 30 });
    
    gsap.set(bgVisualRef.current, { scale: 1.1, y: 0 });
    gsap.set(mainVisualRef.current, { scale: 0.95, y: 0, rotateX: 5 });

    // Play sequence according to Layer 3 instructions
    // 0.00s Background starts almost invisible
    tl.to(bgVisualRef.current, { autoAlpha: 1, scale: 1, duration: 2 }, 0);
    
    // 0.40s Subtle particles/depth appear
    tl.to(particlesRef.current, { autoAlpha: 1, y: 0, duration: 1.5 }, 0.4);
    
    // 0.80s Main visual begins entering
    tl.to(mainVisualRef.current, { autoAlpha: 1, scale: 1, rotateX: 0, duration: 2, ease: 'expo.out' }, 0.8);
    
    // 1.20s Logo/name (or small label) appears
    tl.to(labelRef.current, { autoAlpha: 1, y: 0, duration: 1 }, 1.2);
    
    // 1.50s Headline reveals
    tl.to(headlineRef.current, { autoAlpha: 1, y: 0, duration: 1 }, 1.5);
    
    // 1.90s Supporting text appears
    tl.to(sublineRef.current, { autoAlpha: 1, y: 0, duration: 1 }, 1.9);
    
    // 2.20s CTA appears
    tl.to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 1 }, 2.2);
    
    // 2.50s Scroll indicator becomes visible
    tl.to(scrollIndicatorRef.current, { autoAlpha: 1, y: 0, duration: 1 }, 2.5);

    // 2. ScrollTrigger for continuous transition (Layer 4)
    // Headline moves slightly upward, text fades
    gsap.to([headlineRef.current, labelRef.current], {
      y: -100,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom 20%',
        scrub: true,
      }
    });

    gsap.to([sublineRef.current, ctaRef.current, scrollIndicatorRef.current], {
      y: -50,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'center 20%', // fades out faster
        scrub: true,
      }
    });

    // Main visual slowly moves deeper and transforms
    gsap.to(mainVisualRef.current, {
      y: 200,
      scale: 1.5, // Zooms in as we scroll down to envelop the screen
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // Background shifts deeper
    gsap.to(bgVisualRef.current, {
      scale: 0.8,
      y: 150,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // 3. Mouse Parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current = {
        x: (e.clientX / innerWidth - 0.5) * 2,
        y: (e.clientY / innerHeight - 0.5) * 2
      };

      gsap.to(mainVisualRef.current, {
        x: mouseRef.current.x * 20,
        y: mouseRef.current.y * 20,
        rotationY: mouseRef.current.x * 5,
        rotationX: -mouseRef.current.y * 5,
        duration: 1,
        ease: 'power2.out',
      });
      
      gsap.to(bgVisualRef.current, {
        x: -mouseRef.current.x * 10,
        y: -mouseRef.current.y * 10,
        duration: 2,
        ease: 'power1.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      tl.kill();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{ perspective: '1000px' }}
    >
      {/* 1. Background Visual System */}
      <div 
        ref={bgVisualRef} 
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-60 mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full opacity-50 mix-blend-screen" />
      </div>

      {/* 2. Particles / Depth Layer */}
      <div 
        ref={particlesRef}
        className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_80%)]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* 3. Main Interactive Visual (CSS/GSAP Node Network Abstract) */}
      <div 
        ref={mainVisualRef}
        className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center opacity-30"
      >
        {/* Central glowing core representing the 'Hive' */}
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-4 border-[1px] border-foreground/10 rounded-full animate-spin-slow animate-reverse" style={{ animationDuration: '25s' }} />
          <div className="absolute inset-12 border-[1px] border-purple-500/20 rounded-full animate-spin-slow" style={{ animationDuration: '15s' }} />
          
          {/* Abstract Nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
          <div className="absolute bottom-1/4 right-0 translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7]" />
          <div className="absolute bottom-1/4 left-0 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]" />
        </div>
      </div>

      {/* 4. Foreground Content */}
      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 sm:px-12 flex flex-col items-center text-center mt-12 md:mt-0">
        
        {/* Project Name / Label */}
        <div ref={labelRef} className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 backdrop-blur-md shadow-subtle">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">The University Collaboration Hub</span>
        </div>

        {/* Main Headline */}
        <h1 
          ref={headlineRef}
          className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-balance leading-[1.05] max-w-5xl"
          style={{ fontFeatureSettings: '"salt" 1, "ss01" 1' }} // For sharper typography look
        >
          Discover Teammates. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Build the Future.
          </span>
        </h1>

        {/* Supporting Statement */}
        <p 
          ref={sublineRef}
          className="mt-8 text-lg sm:text-xl text-foreground/60 font-light max-w-2xl mx-auto text-balance leading-relaxed"
        >
          The cinematic platform for student developers, designers, and innovators. Form squads, brainstorm with AI, and showcase your builds to the world.
        </p>

        {/* Primary & Secondary CTAs */}
        <div ref={ctaRef} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-semibold text-base transition-transform hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] w-full sm:w-auto overflow-hidden"
          >
            <span className="relative z-10">Join the Hive</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </Link>
          <Link
            href="#features"
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-foreground/5 border border-foreground/10 text-foreground font-medium text-base hover:bg-foreground/10 hover:border-foreground/20 transition-all w-full sm:w-auto backdrop-blur-md"
          >
            Explore Features
          </Link>
        </div>
      </div>

      {/* 8. Scroll Indicator */}
      <div 
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] font-semibold text-foreground/50">Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-foreground/50 to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-foreground animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}

