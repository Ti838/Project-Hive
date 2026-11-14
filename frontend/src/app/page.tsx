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
import { GitBranchNode } from '@/components/landing/GitBranchSpine';

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
          {/* Section 1 & 2: Hero + Pulse Metrics */}
          <Hero />

          {/* ── GitHub-Style Connected Git Branch Spine: Node 1 ── */}
          <GitBranchNode
            branchName="feat/realtime-workspace"
            commitSha="4a9f1b"
            icon="pr"
            color="indigo"
            statusText="Interactive Showcase"
          />

          {/* Section 3: Interactive 5-Tab Feature Showcase */}
          <Showcase />

          {/* ── GitHub-Style Connected Git Branch Spine: Node 2 ── */}
          <GitBranchNode
            branchName="feat/developer-bento-mesh"
            commitSha="7d3e20"
            icon="terminal"
            color="emerald"
            statusText="Pillars 01-05"
          />

          {/* Section 4: 6-Superpower Bento Grid */}
          <BentoGrid />

          {/* ── GitHub-Style Connected Git Branch Spine: Node 3 ── */}
          <GitBranchNode
            branchName="release/student-passports"
            commitSha="9b5c41"
            icon="shield"
            color="amber"
            statusText="Institutional Proof"
          />

          {/* Section 5: Student & Faculty Testimonials */}
          <Testimonials />

          {/* ── GitHub-Style Connected Git Branch Spine: Node 4 ── */}
          <GitBranchNode
            branchName="docs/community-knowledge"
            commitSha="2e7a84"
            icon="commit"
            color="cyan"
            statusText="Verified FAQ"
          />

          {/* Section 6: Interactive FAQ Accordion */}
          <FAQ />

          {/* ── GitHub-Style Connected Git Branch Spine: Node 5 (Merge into Production) ── */}
          <GitBranchNode
            branchName="main"
            commitSha="HEAD"
            icon="merge"
            color="purple"
            statusText="Ready to Ship"
          />

          {/* Section 7: Final Conversion Call to Action */}
          <CTA />
        </main>

        {/* Global System Footer */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
