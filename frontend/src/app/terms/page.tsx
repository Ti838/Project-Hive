import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - ProjectHive',
  description: 'Terms and conditions governing the use of the ProjectHive developer collaboration platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-3.5 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 px-3 py-1.5 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-2xs">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight hidden sm:inline">ProjectHive</span>
        </Link>
      </header>

      {/* Main Legal Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-4 mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: November 2026 • Effective immediately upon account registration.</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, registering for, or using ProjectHive (the &quot;Platform&quot;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. If you do not agree to these terms, do not access or use the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Platform Description & Scope</h2>
            <p>
              ProjectHive is an online collaborative developer workspace and team formation hub designed for students, hackathon participants, software engineers, and project leads. The platform provides real-time chat, collaborative whiteboards, code execution playgrounds, LiveKit-powered audio/video rooms, and the HiveMind AI assistant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Account Registration and Credentials</h2>
            <p>
              To access collaborative features, you must create an account. You agree to provide accurate, current, and complete registration information, including your legal name and legitimate university/personal email address. You are solely responsible for safeguarding your authentication credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Acceptable Use Policy</h2>
            <p>
              You agree not to use ProjectHive to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Upload or distribute malicious software, worms, or trojans.</li>
              <li>Harass, stalk, threaten, or defame any collaborator or administrator.</li>
              <li>Attempt to circumvent security controls, rate limiters, or access restrictions.</li>
              <li>Execute automated scraping, data extraction, or stress-testing without authorization.</li>
              <li>Impersonate any institution, university, organization, or individual.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Intellectual Property & Code Ownership</h2>
            <p>
              You retain 100% full ownership of all code, software architectures, design documents, and project assets you submit, create, or publish on ProjectHive. ProjectHive does not claim intellectual property rights over code written in collaborative workspaces or showcased projects.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. AI Processing & Third-Party APIs</h2>
            <p>
              ProjectHive incorporates the HiveMind AI system utilizing external model inference providers including Groq Cloud, Google Gemini, and OpenRouter. Prompts submitted to HiveMind are processed through our automated Zero-Leak Sanitizer to strip sensitive credentials and PII. You acknowledge that AI-generated code and recommendations are suggestions and should be reviewed by human engineers before deployment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">7. Account Suspension and Termination</h2>
            <p>
              ProjectHive administrators reserve the right to suspend or terminate accounts that violate this Acceptable Use Policy, harass other members, or introduce platform security vulnerabilities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">8. Limitation of Liability</h2>
            <p>
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. ProjectHive expressly disclaims all warranties, express or implied. Under no circumstances will ProjectHive be liable for direct, indirect, incidental, or consequential damages resulting from data loss, downtime, or collaboration disputes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">9. Contact Information</h2>
            <p>
              For legal inquiries, copyright notices, or security vulnerability disclosures, contact the platform development team at <code className="text-primary">support@projecthive.dev</code>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ProjectHive. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}

