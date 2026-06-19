/**
 * ProjectHive Email Service
 * Uses Brevo HTTP API (not SMTP) — works on Render free tier
 */

const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL_PROD || 'https://projecthive-bd.vercel.app')
  : 'http://localhost:5000';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'timonbiswas33@gmail.com';
const FROM_NAME  = 'ProjectHive';

// ─── HTTP API send helper ──────────────────────────────────────────────────────
async function sendEmail({ to, toName = '', subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn('[Email] No BREVO_API_KEY set — logging email to console');
    console.log(`[Email] TO: ${to}\n[Email] SUBJECT: ${subject}`);
    return { id: 'console-only' };
  }

  const body = {
    sender:      { name: FROM_NAME, email: FROM_EMAIL },
    to:          [{ email: to, name: toName || to }],
    replyTo:     { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    htmlContent: html,
    headers: {
      'X-Mailer': 'ProjectHive',
      'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=unsubscribe>`
    },
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log('[Email] ✉️  Sent to:', to, '| messageId:', data.messageId);
  return data;
}

// ─── Shared email wrapper ──────────────────────────────────────────────────────
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProjectHive</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;">
          <!-- Bee SVG Logo -->
          <div style="margin-bottom:12px;">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="52" height="52" rx="14" fill="rgba(255,255,255,0.15)"/>
              <ellipse cx="26" cy="28" rx="9" ry="10" fill="#FCD34D"/>
              <rect x="19" y="24" width="14" height="4" rx="2" fill="#1e1b4b"/>
              <rect x="19" y="30" width="14" height="4" rx="2" fill="#1e1b4b"/>
              <path d="M17 26c-3 0-5 1.5-5 4s2 4 5 4" stroke="#FCD34D" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M35 26c3 0 5 1.5 5 4s-2 4-5 4" stroke="#FCD34D" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M26 18v-5M24 18l1-4 1 4" stroke="#FCD34D" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <ellipse cx="22" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(-20 22 20)"/>
              <ellipse cx="30" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(20 30 20)"/>
            </svg>
          </div>
          <div style="color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">ProjectHive</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Built for students, by students</div>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background:#1e293b;padding:40px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
          ${content}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#0f172a;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border:1px solid rgba(255,255,255,0.06);border-top:none;">
          <p style="color:#475569;font-size:12px;margin:0 0 6px;">© 2026 ProjectHive — All rights reserved</p>
          <p style="color:#334155;font-size:11px;margin:0;">This email was sent to you because you have an account on ProjectHive.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Verification Email ────────────────────────────────────────────────────────
export async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${FRONTEND_URL}/pages/auth/verify-email.html?token=${token}`;

  const content = `
    <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 8px;">Hey ${firstName}! 👋</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;">
      Welcome to ProjectHive! You're one step away from joining thousands of students collaborating on amazing projects.
      Click the button below to verify your email address.
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${verifyUrl}"
         style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
        Verify Email Address
      </a>
    </div>
    <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 6px;font-weight:600;">⏱ Link expires in 24 hours</p>
      <p style="color:#475569;font-size:12px;margin:0;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color:#6366f1;font-size:11px;margin:8px 0 0;word-break:break-all;">${verifyUrl}</p>
    </div>
    <p style="color:#475569;font-size:12px;margin:0;text-align:center;">
      If you didn't create a ProjectHive account, you can safely ignore this email.
    </p>`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: 'Verify your ProjectHive email',
    html: emailWrapper(content),
  });
}

// ─── Welcome Email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email, firstName) {
  const dashUrl = `${FRONTEND_URL}/pages/user/dashboard.html`;

  const content = `
    <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome aboard, ${firstName}! 🎉</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your email has been verified and your account is ready. Here's what you can do on ProjectHive:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:20px;">🔍</span>
        <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Browse and discover student projects</span>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:20px;">👥</span>
        <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Create or join teams with fellow students</span>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:20px;">💬</span>
        <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Connect and message teammates in real-time</span>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <span style="font-size:20px;">🤖</span>
        <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Use AI to generate brilliant project ideas</span>
      </td></tr>
    </table>
    <div style="text-align:center;">
      <a href="${dashUrl}"
         style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;">
        Go to Dashboard
      </a>
    </div>`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: 'Welcome to ProjectHive!',
    html: emailWrapper(content),
  });
}

// ─── Password Reset Email ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${FRONTEND_URL}/pages/auth/reset-password.html?token=${token}`;

  const content = `
    <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 8px;">Password Reset Request 🔐</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;">
      Hi <strong style="color:#e2e8f0;">${firstName}</strong>, we received a request to reset your ProjectHive password.
      Click the button below to create a new password.
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${resetUrl}"
         style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;">
        Reset My Password
      </a>
    </div>
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="color:#92400e;font-size:13px;margin:0 0 4px;font-weight:600;">⏱ This link expires in 1 hour</p>
      <p style="color:#78350f;font-size:12px;margin:0;">If the button doesn't work, copy and paste this link:</p>
      <p style="color:#d97706;font-size:11px;margin:8px 0 0;word-break:break-all;">${resetUrl}</p>
    </div>
    <p style="color:#475569;font-size:12px;margin:0;text-align:center;">
      If you didn't request a password reset, you can safely ignore this email. Your password won't change.
    </p>`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: 'Reset your ProjectHive password',
    html: emailWrapper(content),
  });
}
