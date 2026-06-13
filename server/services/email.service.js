/**
 * ProjectHive Email Service
 * Uses Brevo HTTP API (not SMTP) — works on Render free tier
 * SMTP is blocked on many cloud platforms, HTTP API is always available
 */

const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL_PROD || 'https://projecthive-bd.vercel.app')
  : 'http://localhost:5000';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'timonbiswas33@gmail.com';
const FROM_NAME  = 'ProjectHive';

// ─── HTTP API send helper ──────────────────────────────────────────────────────
async function sendEmail({ to, toName = '', subject, html }) {
  // If no API key, just log to console
  if (!BREVO_API_KEY) {
    console.warn('[Email] No BREVO_API_KEY set — logging email to console');
    console.log(`[Email] TO: ${to}\n[Email] SUBJECT: ${subject}`);
    return { id: 'console-only' };
  }

  const body = {
    sender:     { name: FROM_NAME, email: FROM_EMAIL },
    to:         [{ email: to, name: toName || to }],
    subject,
    htmlContent: html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log('[Email] ✉️  Sent to:', to, '| messageId:', data.messageId);
  return data;
}

// ─── Base email style ──────────────────────────────────────────────────────────
const baseStyle = `
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Inter',system-ui,sans-serif; }
    .wrap { padding:40px 20px; }
    .card { background:#1e293b; border-radius:20px; overflow:hidden; border:1px solid rgba(255,255,255,.08); max-width:500px; margin:0 auto; }
    .header { background:linear-gradient(135deg,#6366f1,#7c3aed); padding:36px 40px; text-align:center; }
    .logo { font-size:36px; margin-bottom:8px; }
    .brand { color:#fff; font-size:24px; font-weight:800; }
    .tagline { color:rgba(255,255,255,.7); font-size:14px; margin-top:4px; }
    .body { padding:40px; }
    h1 { color:#f1f5f9; font-size:22px; font-weight:700; margin:0 0 12px; }
    p { color:#94a3b8; font-size:15px; line-height:1.6; margin:0 0 20px; }
    .btn { display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:#fff; text-decoration:none; border-radius:12px; font-size:15px; font-weight:700; }
    .center { text-align:center; }
    .note { color:#64748b; font-size:13px; text-align:center; margin-top:20px; }
    .divider { border:none; border-top:1px solid rgba(255,255,255,.08); margin:28px 0; }
    .footer { background:#0f172a; padding:20px 40px; text-align:center; }
    .footer p { color:#475569; font-size:12px; margin:0; }
  </style>
`;

// ─── Verification Email ────────────────────────────────────────────────────────
export async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${FRONTEND_URL}/pages/auth/verify-email.html?token=${token}`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '✅ Verify your ProjectHive email',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head>
<body><div class="wrap">
  <div class="card">
    <div class="header"><div class="logo">🐝</div><div class="brand">ProjectHive</div><div class="tagline">Built for students, by students</div></div>
    <div class="body">
      <h1>Hey ${firstName}! Verify your email 👋</h1>
      <p>You're one step away from joining thousands of students collaborating on amazing projects. Click below to verify your email.</p>
      <div class="center"><a href="${verifyUrl}" class="btn">✅ Verify Email Address</a></div>
      <p class="note">This link expires in <strong style="color:#94a3b8">24 hours</strong></p>
      <hr class="divider">
      <p style="font-size:12px;color:#64748b">If you didn't create a ProjectHive account, ignore this email.<br>Link: ${verifyUrl}</p>
    </div>
    <div class="footer"><p>© 2026 ProjectHive 🐝</p></div>
  </div>
</div></body></html>`,
  });
}

// ─── Welcome Email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email, firstName) {
  const dashUrl = `${FRONTEND_URL}/pages/user/dashboard.html`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '🎉 Welcome to ProjectHive!',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head>
<body><div class="wrap">
  <div class="card">
    <div class="header"><div class="logo">🎉</div><div class="brand">Welcome aboard!</div></div>
    <div class="body">
      <h1>Welcome to ProjectHive, ${firstName}!</h1>
      <p>Your account is ready. Here's what you can do:</p>
      <ul style="color:#94a3b8;font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px">
        <li>🔍 Browse and discover student projects</li>
        <li>👥 Create or join teams</li>
        <li>💬 Connect and message teammates</li>
        <li>🤖 Use AI to generate project ideas</li>
      </ul>
      <div class="center"><a href="${dashUrl}" class="btn">🚀 Go to Dashboard</a></div>
    </div>
    <div class="footer"><p>© 2026 ProjectHive 🐝</p></div>
  </div>
</div></body></html>`,
  });
}

// ─── Password Reset Email ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${FRONTEND_URL}/pages/auth/reset-password.html?token=${token}`;

  return sendEmail({
    to: email,
    toName: firstName,
    subject: '🔐 Reset your ProjectHive password',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head>
<body><div class="wrap">
  <div class="card">
    <div class="header"><div class="logo">🔐</div><div class="brand">Password Reset</div></div>
    <div class="body">
      <h1>Password Reset Request</h1>
      <p>Hi ${firstName}, we received a request to reset your password. Click below to create a new one.</p>
      <div class="center"><a href="${resetUrl}" class="btn">🔐 Reset Password</a></div>
      <p class="note">Link expires in <strong style="color:#94a3b8">1 hour</strong></p>
      <hr class="divider">
      <p style="font-size:12px;color:#64748b">If you didn't request this, ignore this email. Your password won't change.</p>
    </div>
    <div class="footer"><p>© 2026 ProjectHive 🐝</p></div>
  </div>
</div></body></html>`,
  });
}
