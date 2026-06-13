import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NODE_ENV === 'production'
  ? (process.env.APP_URL_PROD || 'https://projecthive-backend.onrender.com')
  : (process.env.APP_URL || 'http://localhost:5000');

const FROM = process.env.EMAIL_FROM || 'ProjectHive <onboarding@resend.dev>';

// ─── Email Verification ───────────────────────────────────────────────────────
export async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${APP_URL}/pages/auth/verify-email.html?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: '✅ Verify your ProjectHive email',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verify Email — ProjectHive</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🐝</div>
              <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-.5px;">ProjectHive</div>
              <div style="color:rgba(255,255,255,.7);font-size:14px;margin-top:4px;">Built for students, by students</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;">
                Hey ${firstName}! Welcome to ProjectHive 👋
              </h1>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                You're one step away from joining thousands of students collaborating on amazing projects.
                Please verify your email address to activate your account.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:.01em;">
                      ✅ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#64748b;font-size:13px;text-align:center;margin:24px 0 0;">
                This link expires in <strong style="color:#94a3b8;">24 hours</strong>
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:28px 0;">

              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                If you didn't create a ProjectHive account, you can safely ignore this email.<br>
                Having trouble? Copy and paste this link: <span style="color:#6366f1;">${verifyUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 40px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © 2026 ProjectHive — Built for students 🐝
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('[ProjectHive] Email send error:', error);
    throw new Error('Failed to send verification email');
  }

  console.log('[ProjectHive] ✉️  Verification email sent to:', email, '| ID:', data?.id);
  return data;
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${APP_URL}/pages/auth/reset-password.html?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🔐 Reset your ProjectHive password',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🔐</div>
              <div style="color:#fff;font-size:24px;font-weight:800;">ProjectHive</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;">Password Reset Request</h1>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Hi ${firstName}, we received a request to reset your password. Click below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;">
                      🔐 Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;text-align:center;margin:24px 0 0;">Link expires in <strong style="color:#94a3b8;">1 hour</strong></p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:28px 0;">
              <p style="color:#64748b;font-size:12px;">If you didn't request this, please ignore this email. Your password won't change.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:20px 40px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">© 2026 ProjectHive 🐝</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) throw new Error('Failed to send password reset email');
  return data;
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email, firstName) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🎉 Welcome to ProjectHive!',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">🎉</div>
          <div style="color:#fff;font-size:24px;font-weight:800;">You're in!</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 12px;">Welcome to ProjectHive, ${firstName}!</h1>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;">Your account is verified. Here's what you can do:</p>
          <ul style="color:#94a3b8;font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px;">
            <li>🔍 Browse and discover student projects</li>
            <li>👥 Create or join teams</li>
            <li>💬 Connect and message teammates</li>
            <li>🤖 Use AI to generate project ideas</li>
          </ul>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${APP_URL}/pages/user/dashboard.html" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;">
                🚀 Go to Dashboard
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#0f172a;padding:20px 40px;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">© 2026 ProjectHive 🐝</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}
