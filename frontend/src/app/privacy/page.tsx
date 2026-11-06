import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - ProjectHive',
  description: 'Privacy Policy detailing data collection, processing, and storage practices for ProjectHive.',
};

export default function PrivacyPage() {
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

      {/* Main Privacy Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-4 mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: November 2026 • Transparency in data handling, storage, and privacy controls.</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
            <p>
              ProjectHive collects information necessary to deliver authentic team formation and collaboration features:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> First name, last name, email address, password hash (salted using bcrypt with cost factor 12).</li>
              <li><strong>Academic Profile Data:</strong> University name, department, year of study, technical skills, portfolio URLs, and bio.</li>
              <li><strong>Media and Attachments:</strong> Profile avatars, team banners, project screenshots, and PDF resumes submitted for team recruitment.</li>
              <li><strong>Technical Telemetry:</strong> Anonymized client IP addresses, browser user agent, device model, and last active timestamps for security monitoring and audit logs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. How We Store and Protect Your Data</h2>
            <p>
              Your data is stored in dedicated, enterprise-grade cloud databases hosted via Supabase PostgreSQL (Singapore region). Relational access is governed strictly by PostgreSQL Row-Level Security (RLS) policies, ensuring users cannot access private team communications or documents without active membership authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Third-Party Service Providers</h2>
            <p>
              We disclose the following operational third-party integrations:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Authentication, relational database management, and media storage.</li>
              <li><strong>LiveKit Cloud:</strong> Real-time audio and video room Selective Forwarding Unit (SFU). Video and audio tracks are forwarded in transit and are not recorded to disk without participant notification.</li>
              <li><strong>Groq Cloud & Google Gemini:</strong> AI model inference for the HiveMind collaboration assistant. Prompts are sanitized prior to dispatch to eliminate credentials and PII.</li>
              <li><strong>Cloudflare Turnstile:</strong> Non-intrusive CAPTCHA challenge verification protecting registration forms against automated bot submission.</li>
              <li><strong>Brevo / Gmail SMTP:</strong> Delivery of transactional emails including account verification and password reset links.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Cookies and Session Management</h2>
            <p>
              ProjectHive uses secure session tokens and local storage strictly for maintaining user authentication state across browser refreshes. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Your Data Rights & Account Deletion</h2>
            <p>
              You maintain the right to inspect, edit, or delete your profile information at any time via Account Settings. Account deletion permanently purges personal profile records and revokes active authentication tokens.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. Contacting Privacy Engineering</h2>
            <p>
              If you have questions regarding this Privacy Policy or wish to request data export, contact our team at <code className="text-primary">privacy@projecthive.dev</code>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ProjectHive. All rights reserved.</span>
          <Link href="/terms" className="hover:text-foreground underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}

