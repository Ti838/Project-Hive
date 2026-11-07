import React from 'react';

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">1. Information We Collect</h3>
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

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">2. How We Store and Protect Your Data</h3>
        <p>
          Your data is stored in dedicated, enterprise-grade cloud databases hosted via Supabase PostgreSQL (Singapore region). Relational access is governed strictly by PostgreSQL Row-Level Security (RLS) policies, ensuring users cannot access private team communications or documents without active membership authorization.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">3. Third-Party Service Providers</h3>
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

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">4. Cookies and Session Management</h3>
        <p>
          ProjectHive uses secure session tokens and local storage strictly for maintaining user authentication state across browser refreshes. We do not use third-party tracking or advertising cookies.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">5. Your Data Rights & Account Deletion</h3>
        <p>
          You maintain the right to inspect, edit, or delete your profile information at any time via Account Settings. Account deletion permanently purges personal profile records and revokes active authentication tokens.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">6. Contacting Privacy Engineering</h3>
        <p>
          If you have questions regarding this Privacy Policy or wish to request data export, contact our team at <code className="text-primary font-mono text-xs">privacy@projecthive.dev</code>.
        </p>
      </section>
    </div>
  );
}

