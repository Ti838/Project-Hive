'use client';

import { SmoothScroll } from '@/components/landing/SmoothScroll';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductStory } from '@/components/landing/ProductStory';
import { FeaturesSequence } from '@/components/landing/FeaturesSequence';
import { Workflow } from '@/components/landing/Workflow';
import { Showcase } from '@/components/landing/Showcase';
import { CTA } from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <SmoothScroll>
      <div className="relative bg-background text-foreground overflow-hidden cinematic-bg font-sans selection:bg-foreground/20 selection:text-white">
        {/* Cinematic Grain/Noise Overlay */}
        <div className="bg-noise" />
        
        <Navbar />

        {/* Foundation Main Content Container */}
        <main className="relative z-10 flex flex-col items-center justify-center">
          <Hero />
          <ProductStory />
          <FeaturesSequence />
          <Workflow />
          <Showcase />
          <CTA />
        </main>
      </div>
    </SmoothScroll>
  );
}

