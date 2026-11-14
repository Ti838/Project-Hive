'use client';

import { SmoothScroll } from '@/components/landing/SmoothScroll';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Showcase } from '@/components/landing/Showcase';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <SmoothScroll>
      <div className="relative bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 selection:text-foreground">
        {/* Subtle noise texture */}
        <div className="bg-noise fixed inset-0 pointer-events-none opacity-20 z-50" />
        
        {/* Sticky Translucent Navbar */}
        <Navbar />

        {/* Core Main Content Flow */}
        <main className="relative z-10 flex flex-col items-center justify-center w-full">
          {/* Section 1 & 2: Hero + Interactive 3D Mesh + Pulse Metrics */}
          <Hero />

          {/* Section 3: Interactive 5-Tab Feature Showcase */}
          <Showcase />

          {/* Section 4: 6-Superpower Bento Grid */}
          <BentoGrid />

          {/* Section 5: Student & Faculty Testimonials */}
          <Testimonials />

          {/* Section 6: Interactive FAQ Accordion */}
          <FAQ />

          {/* Section 7: Final Conversion Call to Action */}
          <CTA />
        </main>

        {/* Global System Footer */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
