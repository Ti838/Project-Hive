'use client';
// ─── Settings Page with Real Persistence & Full Feature Coverage ───────────────

import { useEffect, useState } from 'react';
import {
  Settings, Shield, Bell, Moon, Sun, Save, Check,
  AlertCircle, Lock, Eye, EyeOff, Sparkles, GitBranch,
  Globe, User as UserIcon, Link2, CheckCircle2,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { HiveAIIcon } from '@/components/ai/HiveAIIcon';

type SettingsTab = 'profile' | 'security' | 'ai' | 'notifications' | 'appearance' | 'connected';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { hiveAiEnabled, setHiveAiEnabled } = useUIStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile fields
  const [firstName, setFirstName] = useState(user?.first_name || user?.firstName || '');
  const [lastName, setLastName] = useState(user?.last_name || user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [major, setMajor] = useState(user?.major || user?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || user?.yearOfStudy || 1);
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.hours_per_week || user?.hoursPerWeek || 10);
  const [githubUrl, setGithubUrl] = useState(user?.github || user?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin || user?.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio || user?.portfolio_url || '');
  const [isPublic, setIsPublic] = useState(user?.is_public ?? true);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preference fields
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from user data or local preferences
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || user.firstName || '');
      setLastName(user.last_name || user.lastName || '');
      setBio(user.bio || '');
      setUniversity(user.university || '');
      setMajor(user.major || user.department || '');
      setYearOfStudy(user.year_of_study || user.yearOfStudy || 1);
      setHoursPerWeek(user.hours_per_week || user.hoursPerWeek || 10);
      setGithubUrl(user.github || user.github_url || '');
      setLinkedinUrl(user.linkedin || user.linkedin_url || '');
      setPortfolioUrl(user.portfolio || user.portfolio_url || '');
      setIsPublic(user.is_public ?? true);
    }

    const savedTheme = localStorage.getItem('ph-theme');
    setDarkMode(savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches));

    const soundPref = localStorage.getItem('ph-sound-enabled');
    if (soundPref !== null) setChatSounds(soundPref === 'true');

    const emailPref = localStorage.getItem('ph-email-notifs');
    if (emailPref !== null) setEmailNotifications(emailPref === 'true');
  }, [user]);

  const toggleTheme = (val: boolean) => {
    setDarkMode(val);
    document.documentElement.classList.toggle('dark', val);
    localStorage.setItem('ph-theme', val ? 'dark' : 'light');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      localStorage.setItem('ph-sound-enabled', String(chatSounds));
      localStorage.setItem('ph-email-notifs', String(emailNotifications));

      const res = await api.users.update({
        firstName,
        lastName,
        bio,
        university,
        major,
        yearOfStudy: Number(yearOfStudy),
        hoursPerWeek: Number(hoursPerWeek),
        github: githubUrl,
        linkedin: linkedinUrl,
        portfolio: portfolioUrl,
        isPublic,
      } as any);

      if (res.ok && res.user) {
        updateUser(res.user);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || 'Could not update preferences on server.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.users.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.ok) {
        setPasswordSuccess('Password successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 3500);
      } else {
        setPasswordError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Network error updating password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings & Preferences</h1>
          <p className="text-sm text-muted-foreground">Manage your identity, Hive AI options, security, and notification settings</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
        {[
          { id: 'profile',       label: 'Profile & Info',   icon: UserIcon },
          { id: 'ai',            label: 'Hive AI',          isAi: true },
          { id: 'security',      label: 'Security',         icon: Shield },
          { id: 'notifications', label: 'Notifications',    icon: Bell },
          { id: 'appearance',    label: 'Appearance',       icon: Moon },
          { id: 'connected',     label: 'Integrations',     icon: Link2 },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {tab.isAi ? (
                <HiveAIIcon size={14} className={active ? 'text-primary-foreground' : 'text-amber-500'} />
              ) : Icon ? (
                <Icon className="w-3.5 h-3.5 shrink-0" />
              ) : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile & Identity */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5 shadow-xs">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary" /> Profile Details
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bio / About Me</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you're building or researching..."
              className="w-full p-3 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">University / Institute</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Department / Major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Portfolio URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
            <div>
              <span className="font-medium text-sm block">Public Profile Visibility</span>
              <span className="text-xs text-muted-foreground">Allow your profile and projects to be discovered in People search</span>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 tap-press transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saved ? 'Profile Saved!' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Hive AI Preferences */}
      {activeTab === 'ai' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center">
              <HiveAIIcon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Hive AI Preferences</h2>
              <p className="text-xs text-muted-foreground">Unified multimodal assistant for coding, project reviews, and collaboration</p>
            </div>
          </div>

          <div className="p-4 bg-muted/40 border border-border/60 rounded-2xl space-y-4">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div className="space-y-1">
                <span className="font-semibold text-sm block text-foreground">Enable Hive AI Contextual Assistance</span>
                <span className="text-xs text-muted-foreground block leading-relaxed">
                  When enabled, Hive AI contextual tools appear on demand inside Code Explorer, PR Reviews, Projects, and AI Studio without invasive floating popups.
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block pt-1">
                  Note: Disabling Hive AI hides UI entry points but never deletes your past AI conversations or project data.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hiveAiEnabled}
                onChange={(e) => setHiveAiEnabled(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer mt-1 shrink-0"
              />
            </label>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: <strong className={hiveAiEnabled ? 'text-green-500' : 'text-muted-foreground'}>{hiveAiEnabled ? 'Active & Ready' : 'Disabled'}</strong></span>
              <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">Ctrl + J</kbd></span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5 shadow-xs">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-sm border border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>

            {passwordError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-xs text-green-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {passwordSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 tap-press transition-all shadow-xs disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Notifications & Sounds */}
      {activeTab === 'notifications' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notification Settings
          </h2>

          <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
            <div>
              <span className="font-medium text-sm block">Email Alerts</span>
              <span className="text-xs text-muted-foreground">Receive team invites and important security notifications via email</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
            <div>
              <span className="font-medium text-sm block">Audio Chimes</span>
              <span className="text-xs text-muted-foreground">Play gentle audio notification on incoming direct messages</span>
            </div>
            <input
              type="checkbox"
              checked={chatSounds}
              onChange={(e) => setChatSounds(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Tab 5: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="font-semibold text-base flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />} Theme & Display
          </h2>

          <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
            <div>
              <span className="font-medium text-sm block">Dark Mode</span>
              <span className="text-xs text-muted-foreground">Enable dark background styling for comfortable developer viewing</span>
            </div>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => toggleTheme(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Tab 6: Connected Accounts */}
      {activeTab === 'connected' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Connected Accounts & Integrations
          </h2>

          <div className="p-4 bg-muted/40 border border-border/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border">
                <GitBranch className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">GitHub Integration</p>
                <p className="text-xs text-muted-foreground">{githubUrl || 'Connect your GitHub profile to showcase repos and PRs'}</p>
              </div>
            </div>
            <a
              href="/projects/showcase"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage Repos
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
