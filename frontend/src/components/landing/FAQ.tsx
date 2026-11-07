'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Squads & Teams',
    question: 'How does ProjectHive match student teams for capstones and hackathons?',
    answer: 'ProjectHive calculates a multi-dimensional compatibility score based on technical competencies (programming languages, frameworks), academic discipline, timezone availability, and target capstone tracks. You can filter candidates, inspect verified portfolios, and issue direct 1-click squad invitations.'
  },
  {
    category: 'Cost & Access',
    question: 'Is ProjectHive completely free for university students?',
    answer: 'Yes! ProjectHive is 100% free for students, researchers, and university teams. All core workspace capabilities — including squad matchmaking, unlimited real-time chat, LiveKit WebRTC calls, Kanban sprint tracking, and project showcase publishing — are fully accessible at zero cost.'
  },
  {
    category: 'Audio & Video',
    question: 'What makes LiveKit WebRTC calling superior to Discord or Zoom for team projects?',
    answer: 'Unlike generic conferencing apps, ProjectHive integrates LiveKit SFU natively into your squad room. There are no external meeting links or expired invites. You get zero-latency 4K screen sharing with syntax-mode clarity, persistent spatial audio rooms, and automatic link to your project sprint board.'
  },
  {
    category: 'AI Assistant',
    question: 'How does the HiveMind AI assistant help throughout a semester project?',
    answer: 'HiveMind AI acts as a dedicated technical advisor. It can generate comprehensive project PRDs, design system architectures, recommend modern tech stacks based on your team skills, formulate milestone roadmaps, and even break down massive epics into actionable weekly sprint tasks.'
  },
  {
    category: 'Showcase & Careers',
    question: 'Can recruiters and industry mentors view our completed projects?',
    answer: 'Absolutely. The ProjectHive Showcase acts as your verified public portfolio. When you mark a capstone as shipped, your live demo link, GitHub repository badge, tech stack breakdown, and team member credits become discoverable by industry sponsors, alumni mentors, and hiring managers.'
  },
  {
    category: 'Privacy & Security',
    question: 'How is student data, coursework code, and intellectual property secured?',
    answer: 'ProjectHive enforces strict Row-Level Security (RLS) across all 16 Supabase PostgreSQL database tables. Squad channels, sprint boards, and confidential project repositories are inaccessible to non-team members. Furthermore, all communications are encrypted in transit and at rest.'
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full py-24 sm:py-28 px-4 sm:px-6 lg:px-12 bg-background relative overflow-hidden border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Everything You Need To Know
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Got questions about building on ProjectHive? We've got answers.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-primary/40 bg-card/80 shadow-sm'
                    : 'border-border/70 bg-card/40 hover:border-border'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-6 text-left flex items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {faq.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/40 mt-2 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-12 p-6 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-foreground text-sm">Need help or want to partner with your campus?</div>
            <div className="text-xs text-muted-foreground mt-0.5">Reach out to our student ambassador and developer team directly.</div>
          </div>
          <Link
            href="/feed"
            className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-all flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Contact Helpline
          </Link>
        </div>
      </div>
    </section>
  );
}

