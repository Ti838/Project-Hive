import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.utils.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/email.service.js';
import { getFlags } from './admin.controller.js';

// ─── Helper: strip sensitive fields ──────────────────────────────────────────
function sanitizeUser(user) {
  const { password_hash, refresh_tokens, email_verification_token,
    email_verification_expires, password_reset_token, password_reset_expires, ...safe } = user;
  return safe;
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const FLAGS = getFlags();
    if (!FLAGS.registrationEnabled) {
      return res.status(403).json({ error: 'New user registration is currently disabled by administrators.' });
    }

    const { firstName, lastName, email, password, university, major, yearOfStudy } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check existing user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, first_name, email, is_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.is_verified) {
        // Already verified — just tell them to sign in
        return res.status(400).json({ error: 'Email already registered. Please sign in.' });
      }

      // Exists but NOT verified — resend verification email automatically
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from('users')
        .update({
          email_verification_token: verificationToken,
          email_verification_expires: verificationExpires.toISOString(),
        })
        .eq('id', existing.id);

      try {
        await sendVerificationEmail(existing.email, existing.first_name, verificationToken);
        console.log('[ProjectHive] ✉️  Re-sent verification to:', existing.email);
      } catch (emailErr) {
        console.error('[ProjectHive] Resend failed:', emailErr.message);
      }

      return res.status(201).json({
        message: 'We sent a new verification link to your email. Please check your inbox.',
        emailSent: true,
        requiresVerification: true,
        user: { email: existing.email },
      });
    }

    // New user — create account
    const salt = await bcryptjs.genSalt(12);
    const passwordHash = await bcryptjs.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        university: university || '',
        major: major || '',
        year_of_study: yearOfStudy || null,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
        is_verified: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('[ProjectHive] Register error:', createError);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.first_name, verificationToken);
      console.log('[ProjectHive] ✉️  Verification email sent to:', user.email);
    } catch (emailErr) {
      console.error('[ProjectHive] Verification email failed:', emailErr.message);
    }

    console.log('[ProjectHive] ✅ User registered:', user.email);

    res.status(201).json({
      message: 'Account created! Please check your email and click the verification link.',
      emailSent: true,
      requiresVerification: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        university: user.university,
        isVerified: false,
      },
    });
  } catch (error) {
    console.error('[ProjectHive] Register error:', error);
    next(error);
  }
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    // Find user with this token
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, email_verification_expires, is_verified')
      .eq('email_verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    if (user.is_verified) {
      return res.json({ message: 'Email already verified. You can sign in now.' });
    }

    // Check expiry
    if (new Date(user.email_verification_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }

    // Mark as verified
    await supabaseAdmin
      .from('users')
      .update({
        is_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', user.id);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.first_name);
    } catch (_) { /* non-fatal */ }

    console.log('[ProjectHive] ✅ Email verified:', user.email);

    res.json({ message: 'Email verified successfully! Welcome to ProjectHive 🐝' });
  } catch (error) {
    console.error('[ProjectHive] Email verify error:', error);
    next(error);
  }
}

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, first_name, is_verified')
      .eq('email', email.toLowerCase())
      .single();

    // Always respond success to prevent email enumeration
    if (!user || user.is_verified) {
      return res.json({ message: 'If that email exists and is unverified, we sent a new link.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from('users')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
      })
      .eq('id', user.id);

    await sendVerificationEmail(email, user.first_name, verificationToken);

    res.json({ message: 'Verification email resent. Please check your inbox.' });
  } catch (error) {
    console.error('[ProjectHive] Resend verify error:', error);
    next(error);
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    // Block login if email not verified and email verification is enforced
    const FLAGS = getFlags();
    if (FLAGS.emailVerification && !user.is_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Auto-promote ADMIN_EMAIL to admin role ────────────────────────────────
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
    if (ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL && user.role !== 'admin') {
      await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id);
      user.role = 'admin';
      console.log('[ProjectHive] 👑 Auto-promoted to admin:', user.email);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email, user.role);

    // Keep last 5 refresh tokens (multi-device support)
    const tokens = [...(user.refresh_tokens || []), refreshToken].slice(-5);
    await supabaseAdmin
      .from('users')
      .update({ refresh_tokens: tokens, last_seen: new Date().toISOString(), online_status: 'online' })
      .eq('id', user.id);

    console.log('[ProjectHive] ✅ User logged in:', user.email, '| role:', user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        university: user.university,
        avatar: user.avatar,
        avatarColor: user.avatar_color,
        role: user.role,
        isVerified: user.is_verified,
      },
      accessToken,
      refreshToken,
      emailVerified: user.is_verified,
    });
  } catch (error) {
    console.error('[ProjectHive] Login error:', error);
    next(error);
  }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Missing refresh token.' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, refresh_tokens')
      .eq('id', decoded.id)
      .single();

    if (!user || !(user.refresh_tokens || []).includes(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const tokens = generateTokenPair(user.id, user.email);

    // Rotate token
    const updatedTokens = (user.refresh_tokens || [])
      .filter(t => t !== refreshToken)
      .concat(tokens.refreshToken)
      .slice(-5);

    await supabaseAdmin
      .from('users')
      .update({ refresh_tokens: updatedTokens })
      .eq('id', user.id);

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please sign in again.' });
    }
    next(error);
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (refreshToken) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('refresh_tokens')
        .eq('id', userId)
        .single();

      if (user) {
        const updatedTokens = (user.refresh_tokens || []).filter(t => t !== refreshToken);
        await supabaseAdmin
          .from('users')
          .update({ refresh_tokens: updatedTokens, online_status: 'offline' })
          .eq('id', userId);
      }
    }

    console.log('[ProjectHive] User logged out:', req.user.email);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, first_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always respond success (prevent email enumeration)
    if (!user) {
      return res.json({ message: 'If that email is registered, you will receive a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await supabaseAdmin
      .from('users')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString(),
      })
      .eq('id', user.id);

    const { sendPasswordResetEmail } = await import('../services/email.service.js');
    await sendPasswordResetEmail(email, user.first_name, resetToken);

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('[ProjectHive] Forgot password error:', error);
    next(error);
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, password_reset_expires')
      .eq('password_reset_token', token)
      .single();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }
    if (new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const salt = await bcryptjs.genSalt(12);
    const passwordHash = await bcryptjs.hash(password, salt);

    await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
        refresh_tokens: [], // invalidate all sessions
      })
      .eq('id', user.id);

    res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (error) {
    next(error);
  }
}

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

// ─── GOOGLE OAUTH — INITIATE ──────────────────────────────────────────────────
// Returns the Supabase Google OAuth URL for the frontend to redirect to
export async function googleInitiate(req, res, next) {
  try {
    const APP_URL = process.env.NODE_ENV === 'production'
      ? process.env.APP_URL_PROD
      : (process.env.APP_URL || 'http://localhost:5000');

    const redirectTo = `${APP_URL}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error || !data?.url) {
      console.error('[ProjectHive] Google OAuth initiate error:', error);
      return res.status(500).json({ error: 'Failed to generate Google OAuth URL.' });
    }

    res.json({ url: data.url });
  } catch (error) {
    console.error('[ProjectHive] Google OAuth initiate error:', error);
    next(error);
  }
}

// ─── GOOGLE OAUTH — CALLBACK ──────────────────────────────────────────────────
// Called by the frontend /auth/callback page with the Supabase session tokens
export async function googleCallback(req, res, next) {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Missing Supabase access token.' });
    }

    // Verify the Supabase session and extract user info
    const { data: { user: sbUser }, error: verifyError } = await supabaseAdmin.auth.getUser(access_token);

    if (verifyError || !sbUser) {
      console.error('[ProjectHive] Supabase token verify error:', verifyError);
      return res.status(401).json({ error: 'Invalid or expired Google session.' });
    }

    const email = sbUser.email?.toLowerCase();
    const googleId = sbUser.id; // Supabase auth user ID
    const fullName = sbUser.user_metadata?.full_name || '';
    const avatarUrl = sbUser.user_metadata?.avatar_url || null;
    const firstName = sbUser.user_metadata?.given_name || fullName.split(' ')[0] || 'User';
    const lastName  = sbUser.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || '';

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google account.' });
    }

    // Check if user already exists (by email OR google_id)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`email.eq.${email},google_id.eq.${googleId}`)
      .single();

    let platformUser;

    if (existingUser) {
      // Update google_id & mark verified if not already
      const updates = { google_id: googleId, is_verified: true, auth_provider: 'google' };
      if (avatarUrl && !existingUser.avatar) updates.avatar = avatarUrl;

      const { data: updated } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single();

      platformUser = updated || existingUser;
      console.log('[ProjectHive] 🔑 Google OAuth — existing user signed in:', email);
    } else {
      // New user — create account (no password_hash for OAuth users)
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email,
          google_id: googleId,
          avatar: avatarUrl,
          is_verified: true,
          auth_provider: 'google',
        })
        .select()
        .single();

      if (createError) {
        console.error('[ProjectHive] Google OAuth create user error:', createError);
        return res.status(500).json({ error: 'Failed to create account.' });
      }

      platformUser = newUser;
      console.log('[ProjectHive] ✅ Google OAuth — new user created:', email);
    }

    // Check ban
    if (platformUser.is_banned) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    // Auto-promote admin
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
    if (ADMIN_EMAIL && platformUser.email === ADMIN_EMAIL && platformUser.role !== 'admin') {
      await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', platformUser.id);
      platformUser.role = 'admin';
    }

    // Generate platform JWT (same as regular login)
    const { accessToken, refreshToken: platformRefresh } = generateTokenPair(
      platformUser.id,
      platformUser.email,
      platformUser.role
    );

    // Store refresh token
    const tokens = [...(platformUser.refresh_tokens || []), platformRefresh].slice(-5);
    await supabaseAdmin
      .from('users')
      .update({ refresh_tokens: tokens, last_seen: new Date().toISOString(), online_status: 'online' })
      .eq('id', platformUser.id);

    res.json({
      message: 'Google sign-in successful',
      accessToken,
      refreshToken: platformRefresh,
      user: {
        id: platformUser.id,
        firstName: platformUser.first_name,
        lastName: platformUser.last_name,
        email: platformUser.email,
        university: platformUser.university || '',
        avatar: platformUser.avatar,
        avatarColor: platformUser.avatar_color,
        role: platformUser.role || 'user',
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('[ProjectHive] Google OAuth callback error:', error);
    next(error);
  }
}

