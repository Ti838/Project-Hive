'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Only init smooth scroll and advanced ticks if user prefers motion
    let lenis: Lenis | null = null;
    let handleAnchorClick: ((e: MouseEvent) => void) | null = null;

    if (!isReducedMotion) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);
      lenisRef.current = lenis;

      // Handle anchor links with smooth scroll
      handleAnchorClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target && target.hash && target.pathname === window.location.pathname) {
          const el = document.querySelector(target.hash);
          if (el) {
            e.preventDefault();
            lenis?.scrollTo(el as HTMLElement, { offset: -80, duration: 1.2 });
          }
        }
      };
      document.addEventListener('click', handleAnchorClick);

      // Add Lenis's requestAnimationFrame to GSAP's ticker
      gsap.ticker.add((time) => {
        lenis?.raf(time * 1000);
      });
      // Disable lag smoothing for Lenis
      gsap.ticker.lagSmoothing(0);
    } else {
      // For reduced motion, just configure ScrollTrigger without Lenis
      ScrollTrigger.config({ limitCallbacks: true });
    }

    return () => {
      if (handleAnchorClick) {
        document.removeEventListener('click', handleAnchorClick);
      }
      if (lenis) {
        gsap.ticker.remove((time) => {
          lenis?.raf(time * 1000);
        });
        lenis.destroy();
      }
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return <>{children}</>;
}

