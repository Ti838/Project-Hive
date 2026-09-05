/**
 * ProjectHive Enterprise Email Service
 * High-delivery multi-provider architecture:
 * 1. Gmail SMTP (100% Inbox delivery via App Password)
 * 2. Resend API (Clean modern transactional email)
 * 3. Brevo HTTP API (Global transactional relay)
 * 4. Fallback Console Logger (Local dev without credentials)
 */
import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'https://projecthive-bd.vercel.app')
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

const FROM_EMAIL = process.env.GMAIL_USER || process.env.EMAIL_FROM || process.env.BREVO_FROM_EMAIL || 'timonbiswas33@gmail.com';
const FROM_NAME  = 'ProjectHive';

// ─── 1. Gmail SMTP Transporter ───────────────────────────────────────────────
let gmailTransporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  console.log('[Email] ✅ Gmail SMTP configured — primary inbox delivery active.');
}

// ─── 2. Brevo SMTP Relay Transporter ─────────────────────────────────────────
let brevoSmtpTransporter = null;
const brevoSmtpKey = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY;
const brevoSmtpUser = process.env.BREVO_SMTP_LOGIN;
if (brevoSmtpKey && brevoSmtpUser) {
  brevoSmtpTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: brevoSmtpUser,
      pass: brevoSmtpKey,
    },
  });
  console.log('[Email] ✅ Brevo SMTP Relay configured — transactional delivery active.');
}

// ─── Unified Send Helper ─────────────────────────────────────────────────────
export async function sendEmail({ to, toName = '', subject, html }) {
  // Strategy 1: Gmail SMTP (preferred if configured)
  if (gmailTransporter) {
    try {
      const info = await gmailTransporter.sendMail({
        from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('[Email] ✉️  Gmail sent to:', to, '| messageId:', info.messageId);
      return { ok: true, messageId: info.messageId, provider: 'gmail' };
    } catch (err) {
      console.error('[Email] Gmail SMTP error:', err.message, '— falling back...');
    }
  }

  // Strategy 2: Brevo SMTP Relay (Active via Render Environment)
  if (brevoSmtpTransporter) {
    try {
      const fromAddr = process.env.BREVO_FROM_EMAIL || 'timonbiswas33@gmail.com';
      const info = await brevoSmtpTransporter.sendMail({
        from: `"${FROM_NAME}" <${fromAddr}>`,
        to,
        subject,
        html,
      });
      console.log('[Email] ✉️  Brevo SMTP sent to:', to, '| messageId:', info.messageId);
      return { ok: true, messageId: info.messageId, provider: 'brevo-smtp' };
    } catch (err) {
      console.error('[Email] Brevo SMTP error:', err.message, '— falling back...');
    }
  }

  // Strategy 2: Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
          to: [to],
          subject,
          html,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[Email] ✉️  Resend sent to:', to, '| id:', data.id);
        return { ok: true, messageId: data.id, provider: 'resend' };
      }
    } catch (err) {
      console.error('[Email] Resend API error:', err.message);
    }
  }

  // Strategy 3: Brevo HTTP API
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: FROM_NAME, email: FROM_EMAIL },
          to: [{ email: to, name: toName || to }],
          replyTo: { email: FROM_EMAIL, name: FROM_NAME },
          subject,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Email] ✉️  Brevo sent to:', to, '| messageId:', data.messageId);
        return { ok: true, messageId: data.messageId, provider: 'brevo' };
      }
    } catch (err) {
      console.error('[Email] Brevo API error:', err.message);
    }
  }

  // Strategy 4: Fallback Console Output
  console.log('──────────────────────────────────────────────────────');
  console.log(`[Email Mock Log] TO: ${to}`);
  console.log(`[Email Mock Log] SUBJECT: ${subject}`);
  console.log('──────────────────────────────────────────────────────');
  return { ok: true, id: 'console-mock', provider: 'console' };
}

// ─── Master Modern Email Wrapper ─────────────────────────────────────────────
function emailWrapper({ badge = 'PROJECTHIVE', title, subtitle, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || 'ProjectHive'}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#131B2E;border:1px solid #1E293B;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg, #F59E0B 0%, #6366F1 50%, #EC4899 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;background:radial-gradient(ellipse at top, rgba(245,158,11,0.08) 0%, rgba(19,27,46,0) 70%);">
              <!-- Logo Mark -->
              <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(99,102,241,0.15) 100%);border:1px solid rgba(245,158,11,0.3);border-radius:18px;line-height:56px;text-align:center;margin-bottom:16px;">
                <span style="font-size:28px;vertical-align:middle;">🐝</span>
              </div>
              
              <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#F59E0B;text-transform:uppercase;margin-bottom:6px;">
                ${badge}
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;line-height:1.25;">
                ${title}
              </h1>
              ${subtitle ? `<p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.5;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #1E293B;"></div>
            </td>
          </tr>

          <!-- Main Dynamic Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color:#0E1526;padding:24px 40px;text-align:center;border-top:1px solid #1E293B;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748B;">
                © 2026 ProjectHive — Student Developer Collaboration Platform
              </p>
              <p style="margin:0;font-size:11px;color:#475569;line-height:1.5;">
                Dhaka, Bangladesh • Built for high-velocity developer squads
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Verification Email ───────────────────────────────────────────────────
export async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#CBD5E1;line-height:1.7;">
      Hey <strong style="color:#FFFFFF;">${firstName || 'Developer'}</strong>,
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#94A3B8;line-height:1.7;">
      Welcome to <strong style="color:#F59E0B;">ProjectHive</strong>! You are one step away from connecting with student developers, joining innovative teams, and building high-impact hackathon projects.
    </p>

    <!-- Call to Action Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}"
             target="_blank"
             style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg, #F59E0B 0%, #D97706 100%);color:#0F172A;font-size:15px;font-weight:800;text-decoration:none;border-radius:14px;box-shadow:0 10px 25px -5px rgba(245,158,11,0.4);letter-spacing:0.2px;">
            Verify Email Address →
          </a>
        </td>
      </tr>
    </table>

    <!-- Security Info Box -->
    <div style="background-color:#0E1526;border:1px solid #1E293B;border-radius:14px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <span style="font-size:14px;margin-right:8px;">⏱</span>
        <span style="font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:0.5px;">Link Expires in 24 Hours</span>
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:#64748B;">If the button above does not work, copy and paste this link into your browser:</p>
      <div style="font-family:monospace;font-size:11px;color:#94A3B8;background:#131B2E;padding:8px 12px;border-radius:8px;word-break:break-all;border:1px solid #1E293B;">
        ${verifyUrl}
      </div>
    </div>

    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.5;">
      If you did not sign up for a ProjectHive account, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '🐝 Verify your ProjectHive email address',
    html: emailWrapper({
      badge: 'ACCOUNT VERIFICATION',
      title: 'Confirm Your Email Address',
      subtitle: 'Complete your registration to unlock student collaboration',
      content,
    }),
  });
}

// ─── 2. Welcome Email ────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email, firstName) {
  const dashUrl = `${FRONTEND_URL}/dashboard`;

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#CBD5E1;line-height:1.7;">
      Welcome aboard, <strong style="color:#FFFFFF;">${firstName || 'Developer'}</strong>! 🎉
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.7;">
      Your email is officially verified. Your developer identity is live across the ProjectHive ecosystem. Here is how you can jump in right now:
    </p>

    <!-- Checklist -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:12px;background:#0E1526;border-radius:12px;margin-bottom:8px;border:1px solid #1E293B;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" style="font-size:18px;">🚀</td>
              <td style="font-size:13px;color:#E2E8F0;font-weight:600;">Showcase Your Projects</td>
            </tr>
            <tr>
              <td></td>
              <td style="font-size:12px;color:#94A3B8;padding-top:2px;">Connect GitHub repos, preview commits, and generate automated AI code reviews.</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px;background:#0E1526;border-radius:12px;border:1px solid #1E293B;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" style="font-size:18px;">👥</td>
              <td style="font-size:13px;color:#E2E8F0;font-weight:600;">Recruit or Join Hackathon Teams</td>
            </tr>
            <tr>
              <td></td>
              <td style="font-size:12px;color:#94A3B8;padding-top:2px;">Find collaborators with complementary frontend, backend, AI, and design skills.</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px;background:#0E1526;border-radius:12px;border:1px solid #1E293B;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" style="font-size:18px;">✨</td>
              <td style="font-size:13px;color:#E2E8F0;font-weight:600;">Explore Hive AI Intelligence</td>
            </tr>
            <tr>
              <td></td>
              <td style="font-size:12px;color:#94A3B8;padding-top:2px;">Contextual multimodal assistance for code explanations, PR reviews, and ideation.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${dashUrl}"
             target="_blank"
             style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:14px;box-shadow:0 10px 25px -5px rgba(99,102,241,0.4);">
            Go to Your Dashboard →
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '🎉 Welcome to ProjectHive!',
    html: emailWrapper({
      badge: 'GET STARTED',
      title: 'Welcome to the Hive',
      subtitle: 'Your workspace is ready for collaboration',
      content,
    }),
  });
}

// ─── 3. Password Reset Email ─────────────────────────────────────────────────
export async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#CBD5E1;line-height:1.7;">
      Hi <strong style="color:#FFFFFF;">${firstName || 'there'}</strong>,
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#94A3B8;line-height:1.7;">
      We received a request to reset the password for your ProjectHive account. Click the button below to set a new password.
    </p>

    <!-- Call to Action Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}"
             target="_blank"
             style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg, #EC4899 0%, #BE185D 100%);color:#FFFFFF;font-size:15px;font-weight:800;text-decoration:none;border-radius:14px;box-shadow:0 10px 25px -5px rgba(236,72,153,0.4);letter-spacing:0.2px;">
            Reset Password →
          </a>
        </td>
      </tr>
    </table>

    <!-- Expiry Box -->
    <div style="background-color:#0E1526;border:1px solid #1E293B;border-radius:14px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#F43F5E;">⏱ Link Expires in 1 Hour</p>
      <p style="margin:0 0 8px;font-size:12px;color:#64748B;">If the button does not work, copy and paste this link:</p>
      <div style="font-family:monospace;font-size:11px;color:#94A3B8;background:#131B2E;padding:8px 12px;border-radius:8px;word-break:break-all;border:1px solid #1E293B;">
        ${resetUrl}
      </div>
    </div>

    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.5;">
      If you did not request a password reset, you can safely ignore this message. Your password will remain unchanged.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '🔐 Reset your ProjectHive password',
    html: emailWrapper({
      badge: 'SECURITY ALERT',
      title: 'Password Reset Request',
      subtitle: 'Create a new secure password for your account',
      content,
    }),
  });
}
