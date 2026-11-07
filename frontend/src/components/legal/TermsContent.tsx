import React from 'react';

export function TermsContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">1. Acceptance of Terms</h3>
        <p>
          By accessing, browsing, registering for, or using ProjectHive (the &quot;Platform&quot;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. If you do not agree to these terms, do not access or use the platform.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">2. Platform Description & Scope</h3>
        <p>
          ProjectHive is an online collaborative developer workspace and team formation hub designed for students, hackathon participants, software engineers, and project leads. The platform provides real-time chat, collaborative whiteboards, code execution playgrounds, LiveKit-powered audio/video rooms, and the HiveMind AI assistant.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">3. Account Registration and Credentials</h3>
        <p>
          To access collaborative features, you must create an account. You agree to provide accurate, current, and complete registration information, including your legal name and legitimate university/personal email address. You are solely responsible for safeguarding your authentication credentials and for all activities that occur under your account.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">4. Acceptable Use Policy</h3>
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

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">5. Intellectual Property & Code Ownership</h3>
        <p>
          You retain 100% full ownership of all code, software architectures, design documents, and project assets you submit, create, or publish on ProjectHive. ProjectHive does not claim intellectual property rights over code written in collaborative workspaces or showcased projects.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">6. AI Processing & Third-Party APIs</h3>
        <p>
          ProjectHive incorporates the HiveMind AI system utilizing external model inference providers including Groq Cloud, Google Gemini, and OpenRouter. Prompts submitted to HiveMind are processed through our automated Zero-Leak Sanitizer to strip sensitive credentials and PII. You acknowledge that AI-generated code and recommendations are suggestions and should be reviewed by human engineers before deployment.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">7. Account Suspension and Termination</h3>
        <p>
          ProjectHive administrators reserve the right to suspend or terminate accounts that violate this Acceptable Use Policy, harass other members, or introduce platform security vulnerabilities.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">8. Limitation of Liability</h3>
        <p>
          The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. ProjectHive expressly disclaims all warranties, express or implied. Under no circumstances will ProjectHive be liable for direct, indirect, incidental, or consequential damages resulting from data loss, downtime, or collaboration disputes.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">9. Contact Information</h3>
        <p>
          For legal inquiries, copyright notices, or security vulnerability disclosures, contact the platform development team at <code className="text-primary font-mono text-xs">support@projecthive.dev</code>.
        </p>
      </section>
    </div>
  );
}

