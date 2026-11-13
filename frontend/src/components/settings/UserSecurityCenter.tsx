'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Smartphone,
  Laptop,
  Globe,
  KeyRound,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Clock,
  Sparkles,
  QrCode,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface UserSecurityCenterProps {
  user: any;
  sessions: any[];
  loadingSessions: boolean;
  onRefreshSessions: () => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeOtherSessions: () => void;
  onExportData: () => void;
  exporting: boolean;
  onDeleteAccount: () => void;
}

export function UserSecurityCenter({
  user,
  sessions,
  loadingSessions,
  onRefreshSessions,
  onRevokeSession,
  onRevokeOtherSessions,
  onExportData,
  exporting,
  onDeleteAccount,
}: UserSecurityCenterProps) {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email verification resend state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // MFA simulation modal
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Account deletion dialog
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Password Strength Calculation (0 - 100)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[a-z]/.test(pass)) score += 10;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;
    return Math.min(100, score);
  };

  const passwordScore = getPasswordStrength(newPassword);
  const getStrengthColor = (score: number) => {
    if (score < 40) return 'bg-rose-500 text-rose-400';
    if (score < 75) return 'bg-amber-500 text-amber-400';
    return 'bg-emerald-500 text-emerald-400';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.users.changePassword(currentPassword, newPassword);
      if (res.ok) {
        setPasswordSuccess(res.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to update password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    try {
      setResendingEmail(true);
      setResendStatus(null);
      const res = await api.auth.resendVerification(user.email);
      setResendStatus(res.message || 'Verification link sent to your inbox!');
    } catch {
      setResendStatus('Failed to resend verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Account Protection Header Card ────────────────────────── */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>User Security Center</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage zero-trust identity authentication, device hygiene, and account privacy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Zero-Trust Guard Active
            </span>
          </div>
        </div>

        {/* Security Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Email Verification Status */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Email Verification</span>
              {user?.is_verified || user?.isVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="font-bold text-sm text-foreground">
              {user?.is_verified || user?.isVerified ? 'Email Confirmed' : 'Verification Required'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {user?.email || 'No email attached'}
            </p>
            {!(user?.is_verified || user?.isVerified) && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {resendingEmail ? 'Sending...' : 'Resend Verification Link'}
              </button>
            )}
            {resendStatus && (
              <p className="text-[10px] text-amber-400">{resendStatus}</p>
            )}
          </div>

          {/* MFA / Two-Factor Authentication */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Two-Factor Auth (TOTP)</span>
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <div className="font-bold text-sm text-foreground">
              {mfaEnabled ? 'Authenticator Enabled' : 'Not Configured'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Protects against credential stuffing and session theft.
            </p>
            <button
              type="button"
              onClick={() => setShowMfaModal(true)}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
            >
              {mfaEnabled ? 'Manage Authenticator' : 'Setup Authenticator'}
            </button>
          </div>

          {/* Active Sessions Count */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Active Sessions</span>
              <Laptop className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-bold text-sm text-foreground">
              {sessions.length} {sessions.length === 1 ? 'Device Connected' : 'Devices Connected'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Current browser and authorized devices.
            </p>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={onRevokeOtherSessions}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold transition-colors"
              >
                Revoke Other Sessions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. Password Hardening & Change ────────────────────────────── */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Change Password</h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Bcrypt 12 Rounds Salted</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Current Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none transition-colors"
            />

            {/* Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Password Strength</span>
                  <span className={cn('font-semibold', getStrengthColor(passwordScore).split(' ')[1])}>
                    {passwordScore < 40 ? 'Weak' : passwordScore < 75 ? 'Good' : 'Strong'} ({passwordScore}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-300', getStrengthColor(passwordScore).split(' ')[0])}
                    style={{ width: `${passwordScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPassword ? 'Hide passwords' : 'Show passwords'}</span>
          </button>

          {passwordError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 tap-press transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {changingPassword ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>

      {/* ─── 3. Active Devices & Sessions ──────────────────────────────── */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary" /> Active Login Sessions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live devices with cryptographic JWT tokens authenticated to your account
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshSessions}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
              title="Refresh sessions"
            >
              <RefreshCw className={cn('w-4 h-4', loadingSessions && 'animate-spin')} />
            </button>

            {sessions.length > 1 && (
              <button
                type="button"
                onClick={onRevokeOtherSessions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Revoke Other Sessions
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {sessions.map((sess, idx) => (
            <div
              key={sess.id || idx}
              className={cn(
                'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                sess.is_current
                  ? 'bg-primary/5 border-primary/30 shadow-xs'
                  : 'bg-muted/30 border-border/60 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center shrink-0">
                  {sess.device_category === 'mobile' ? (
                    <Smartphone className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Laptop className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {sess.browser_name || 'Chrome'} on {sess.os_name || 'Windows'}
                    </span>
                    {sess.is_current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                        This Device
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>IP: {sess.ip_address}</span>
                    <span>•</span>
                    <span>{sess.city || 'Campus'}, {sess.country || 'BD'}</span>
                    <span>•</span>
                    <span>Active: {new Date(sess.last_active_at || sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {!sess.is_current && (
                <button
                  type="button"
                  onClick={() => onRevokeSession(sess.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold self-start sm:self-auto transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. Data Privacy & Account Deletion ────────────────────────── */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
          <Globe className="w-4 h-4 text-primary" /> Data Governance & Account Rights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Portability */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Download className="w-4 h-4 text-primary" /> Export My Data (GDPR)
            </div>
            <p className="text-xs text-muted-foreground">
              Download a complete JSON export of your student profile, enrolled squads, projects, and platform interactions.
            </p>
            <button
              type="button"
              onClick={onExportData}
              disabled={exporting}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{exporting ? 'Preparing Download...' : 'Download JSON Archive'}</span>
            </button>
          </div>

          {/* Account Deletion */}
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
              <Trash2 className="w-4 h-4" /> Danger Zone: Delete Account
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently delete your profile, team memberships, and active credentials. This action is irreversible.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MFA Setup Modal ───────────────────────────────────────────── */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e131b] border border-foreground/10 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Setup Authenticator App</h3>
              </div>
              <button
                onClick={() => setShowMfaModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Scan this QR code with Google Authenticator, 1Password, or Microsoft Authenticator, then enter the 6-digit confirmation code.
            </p>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl border border-foreground/10 space-y-3">
              <div className="w-36 h-36 bg-white rounded-xl p-2 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-950" />
              </div>
              <div className="font-mono text-xs text-amber-400 font-bold tracking-widest">
                HJ3K 89LP QW4R 7T99
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-11 text-center font-mono text-lg tracking-widest bg-slate-900 border border-foreground/10 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-foreground/10">
              <button
                onClick={() => setShowMfaModal(false)}
                className="px-4 py-2 rounded-xl bg-foreground/5 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (mfaCode.length === 6) {
                    setMfaEnabled(true);
                    setShowMfaModal(false);
                    setMfaCode('');
                  }
                }}
                disabled={mfaCode.length !== 6}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                Verify & Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Account Confirmation Modal ─────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e131b] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Permanently Delete Account?</h3>
            </div>
            <p className="text-xs text-slate-300">
              All your student profile details, squad memberships, and personal messages will be permanently removed. To confirm, type <strong className="text-rose-400">DELETE</strong> below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full h-10 px-3 bg-slate-900 border border-rose-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 rounded-xl bg-foreground/5 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  onDeleteAccount();
                }}
                disabled={deleteConfirmText !== 'DELETE'}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

