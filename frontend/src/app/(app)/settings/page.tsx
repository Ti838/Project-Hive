'use client';
// â”€â”€â”€ Settings Page with Real Persistence, Active Sessions & Privacy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Bell, Moon, Sun, Save, Check,
  AlertCircle, Lock, Eye, EyeOff, Sparkles, GitBranch,
  Globe, User as UserIcon, Link2, CheckCircle2, Laptop, Smartphone,
  Monitor, LogOut, Download, KeyRound, ShieldCheck, Eye as EyeIcon, Volume2,
  VolumeX, Play, Music, Radio,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, useUIStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { HiveAIIcon } from '@/components/ai/HiveAIIcon';
import { cn } from '@/lib/utils';
import { soundEngine, type SoundPack } from '@/lib/soundEngine';
import { NotificationSoundSettings } from '@/components/settings/NotificationSoundSettings';

type SettingsTab = 'profile' | 'privacy' | 'security' | 'sessions' | 'ai' | 'notifications' | 'appearance' | 'connected';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const {
    hiveAiEnabled,
    setHiveAiEnabled,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    soundPack,
    setSoundPack,
  } = useUIStore();
  const { theme, resolvedTheme, setTheme } = useTheme();

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
  const [lookingForSquads, setLookingForSquads] = useState(true);

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
  const [directMessageAlerts, setDirectMessageAlerts] = useState(true);
  const [mentionPings, setMentionPings] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Sessions & Location Privacy State
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState<'private' | 'campus' | 'city'>('campus');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize from user database record
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

      // Cloud settings sync
      const userSettings = user.settings || {};
      if (userSettings.emailNotifications !== undefined) setEmailNotifications(Boolean(userSettings.emailNotifications));
      if (userSettings.chatSounds !== undefined) setChatSounds(Boolean(userSettings.chatSounds));
      if (userSettings.directMessageAlerts !== undefined) setDirectMessageAlerts(Boolean(userSettings.directMessageAlerts));
      if (userSettings.mentionPings !== undefined) setMentionPings(Boolean(userSettings.mentionPings));
      if (userSettings.lookingForSquads !== undefined) setLookingForSquads(Boolean(userSettings.lookingForSquads));
      if (userSettings.locationPrivacy) setLocationPrivacy(userSettings.locationPrivacy);
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.users.getSessions();
      if (res && res.sessions) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.warn('Could not load user sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleUpdateSetting = async (key: string, value: any) => {
    if (key === 'emailNotifications') setEmailNotifications(value);
    if (key === 'chatSounds') setChatSounds(value);
    if (key === 'directMessageAlerts') setDirectMessageAlerts(value);
    if (key === 'mentionPings') setMentionPings(value);
    if (key === 'lookingForSquads') setLookingForSquads(value);
    if (key === 'theme') {
      setTheme(value);
    }

    try {
      const res = await api.users.updateSettings({ [key]: value });
      if (res.ok && res.user) {
        updateUser(res.user);
        showToast('Settings saved to your cloud profile');
      } else {
        const currentSettings = user?.settings || {};
        const fallbackRes = await api.users.update({
          settings: { ...currentSettings, [key]: value }
        } as any);
        if (fallbackRes.ok && fallbackRes.user) {
          updateUser(fallbackRes.user);
          showToast('Settings saved to your cloud profile');
        }
      }
    } catch (err: any) {
      console.warn('Failed to sync setting to server:', err);
      showToast('Preference updated');
    }
  };

  const toggleTheme = (val: boolean) => {
    const themeStr = val ? 'dark' : 'light';
    handleUpdateSetting('theme', themeStr);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await api.users.update({
        first_name: firstName,
        last_name: lastName,
        bio,
        university,
        major,
        year_of_study: Number(yearOfStudy),
        hours_per_week: Number(hoursPerWeek),
        github: githubUrl,
        linkedin: linkedinUrl,
        portfolio: portfolioUrl,
        is_public: isPublic,
      });

      if (res.ok && res.user) {
        updateUser(res.user);
        setSaved(true);
        showToast('Profile updated successfully');
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.error || 'Failed to update profile');
      }
    } catch {
      setError('An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
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

    setChangingPassword(true);
    try {
      const res = await api.users.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.ok) {
        setPasswordSuccess('Password successfully updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to update password');
      }
    } catch {
      setPasswordError('An error occurred while updating password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.users.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('Device session revoked');
    } catch {
      showToast('Failed to revoke session');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.users.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current || s.isCurrent));
      showToast('Logged out of all other active sessions');
    } catch {
      showToast('Failed to revoke other sessions');
    }
  };

  // Export User Data (GDPR / Data Portability)
  const handleExportData = async () => {
    setExporting(true);
    try {
      const [userRes, projectsRes] = await Promise.allSettled([
        api.users.me(),
        api.projects.list({}),
      ]);

      const myProjects = projectsRes.status === 'fulfilled' && projectsRes.value.ok
        ? (projectsRes.value.projects || []).filter((p) => p.owner_id === user?.id || p.creator_id === user?.id)
        : [];

      const exportBundle = {
        exportedAt: new Date().toISOString(),
        platform: 'ProjectHive Collaboration Engine',
        version: '2.0.0',
        user: userRes.status === 'fulfilled' && userRes.value.ok ? userRes.value : user,
        authoredProjects: myProjects,
        settings: user?.settings || {},
      };

      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projecthive-data-${user?.id || 'export'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully (JSON)');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings & Security</h1>
          <p className="text-sm text-muted-foreground">Manage your identity, sessions, privacy, Hive AI, and notifications</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
        {[
          { id: 'profile',       label: 'Profile & Info',   icon: UserIcon },
          { id: 'privacy',       label: 'Privacy & Social', icon: Globe },
          { id: 'security',      label: 'Password & Auth',  icon: Shield },
          { id: 'sessions',      label: 'Active Devices',   icon: Laptop },
          { id: 'ai',            label: 'Hive AI',          isAi: true },
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
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
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
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
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

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 tap-press transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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

      {/* Tab 2: Privacy & Social Visibility */}
      {activeTab === 'privacy' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Privacy & Social Visibility
            </h2>
            <p className="text-xs text-muted-foreground">Control how you appear across campus discovery and collaborative squads</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl cursor-pointer hover:bg-muted/70 transition-colors border border-border/50">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm block">Public Profile Discovery</span>
                <span className="text-xs text-muted-foreground block">Allow other students on campus to find your profile in Student Directory search</span>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  api.users.update({ is_public: e.target.checked } as any);
                  showToast('Profile visibility updated');
                }}
                className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0 ml-4"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl cursor-pointer hover:bg-muted/70 transition-colors border border-border/50">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm block">Looking for Squads & Hackathons</span>
                <span className="text-xs text-muted-foreground block">Show a green "Open to collaborate" badge on your profile and social cards</span>
              </div>
              <input
                type="checkbox"
                checked={lookingForSquads}
                onChange={(e) => handleUpdateSetting('lookingForSquads', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 ml-4"
              />
            </label>

            {/* Location Intelligence Privacy */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Campus & Geographical Privacy
                </span>
                <span className="text-xs text-muted-foreground block">
                  Choose the granularity of your location visible to potential teammates and project partners
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { id: 'campus', title: '🎓 Campus Only', desc: 'Visible only to verified peers at your university' },
                  { id: 'city', title: '🌍 City-Wide', desc: 'Discoverable by students across your metropolitan area' },
                  { id: 'private', title: '🔒 Private', desc: 'Completely hide location from search and discovery' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setLocationPrivacy(opt.id as any);
                      handleUpdateSetting('locationPrivacy', opt.id);
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all tap-press cursor-pointer',
                      locationPrivacy === opt.id
                        ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <div className="text-xs font-bold text-foreground mb-1">{opt.title}</div>
                    <div className="text-[10px] leading-tight text-muted-foreground">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Portability (Download My Data) */}
          <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Download className="w-4 h-4" /> Data Portability & Privacy Compliance (GDPR)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can export a full copy of your personal data, authored projects, and collaboration settings in standard JSON format at any time.
            </p>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs rounded-xl shadow-xs tap-press transition-all cursor-pointer"
            >
              {exporting ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export My Data (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
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
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
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
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 tap-press transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Active Sessions & Device Manager */}
      {activeTab === 'sessions' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Laptop className="w-4 h-4 text-primary" /> Active Login Sessions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Devices currently authenticated with your ProjectHive account</p>
            </div>

            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold rounded-xl tap-press transition-all self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out of all other sessions
              </button>
            )}
          </div>

          {loadingSessions ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Querying authenticated hardware sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No other active sessions detected.
            </div>
          ) : (
            <div className="divide-y divide-border/50 border border-border/60 rounded-2xl overflow-hidden bg-card">
              {sessions.map((sess) => {
                const deviceName = sess.device_model || sess.device || 'Active Device';
                const browserName = sess.browser_name ? `${sess.browser_name} (${sess.os_name || 'OS'})` : (sess.browser || 'Browser');
                const ipDisplay = sess.ip_address || sess.ip || '127.0.0.1';
                const locDisplay = sess.city ? ` · ${sess.city}, ${sess.country || ''}` : '';
                const isCurr = Boolean(sess.is_current || sess.isCurrent);
                const isMobile = (sess.device_category === 'mobile') || deviceName.includes('iPhone') || deviceName.includes('Mobile');

                return (
                  <div key={sess.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center border',
                        isCurr ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/70 border-border text-muted-foreground'
                      )}>
                        {isMobile ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{deviceName}</span>
                          {isCurr && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {browserName} · IP: {ipDisplay}{locDisplay}
                        </p>
                      </div>
                    </div>

                    {!isCurr && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-xs text-muted-foreground hover:text-destructive font-medium px-2.5 py-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Hive AI Preferences */}
      {activeTab === 'ai' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
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

      {/* Tab 6: Notifications & Sounds (Live Audio Chime Engine) */}
      {activeTab === 'notifications' && (
        <NotificationSoundSettings
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          soundPack={soundPack}
          setSoundPack={setSoundPack}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
          emailNotifications={emailNotifications}
          directMessageAlerts={directMessageAlerts}
          mentionPings={mentionPings}
          handleUpdateSetting={handleUpdateSetting}
        />
      )}

      {/* Tab 7: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />} Theme & Display
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Customize how ProjectHive looks on your device. Choose light, dark, or sync automatically with your system settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => handleUpdateSetting('theme', 'light')}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border text-left transition-all tap-press cursor-pointer relative overflow-hidden',
                theme === 'light'
                  ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'bg-muted/30 border-border/70 hover:bg-muted/60 hover:border-border'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm text-foreground">Light</span>
                {theme === 'light' && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Crisp daytime interface with high-contrast typography
              </span>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => handleUpdateSetting('theme', 'dark')}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border text-left transition-all tap-press cursor-pointer relative overflow-hidden',
                theme === 'dark'
                  ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'bg-muted/30 border-border/70 hover:bg-muted/60 hover:border-border'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary mb-3">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm text-foreground">Dark</span>
                {theme === 'dark' && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Obsidian zinc palette designed for comfortable focus
              </span>
            </button>

            {/* Auto / System Card */}
            <button
              type="button"
              onClick={() => handleUpdateSetting('theme', 'system')}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border text-left transition-all tap-press cursor-pointer relative overflow-hidden',
                theme === 'system'
                  ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'bg-muted/30 border-border/70 hover:bg-muted/60 hover:border-border'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm text-foreground">Auto (System)</span>
                {theme === 'system' && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Syncs dynamically with your OS & device appearance ({resolvedTheme})
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 8: Connected Accounts */}
      {activeTab === 'connected' && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
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
            <Link
              href="/projects"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage Projects
            </Link>
          </div>
        </div>
      )}

      {/* Floating Confirmation Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl surface-floating border border-foreground/10 text-white text-xs font-semibold shadow-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

