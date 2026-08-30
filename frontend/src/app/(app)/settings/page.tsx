'use client';
// ─── Settings Page ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Settings, Shield, Bell, Moon, Sun, Monitor, Save, Check } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your notification preferences, privacy, and account configuration</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 divide-y divide-border">
        {/* Account Info */}
        <div className="space-y-3">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Account & Security
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-muted/60 rounded-xl">
              <span className="text-xs text-muted-foreground block">Email Address</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="p-3.5 bg-muted/60 rounded-xl">
              <span className="text-xs text-muted-foreground block">University</span>
              <span className="font-medium">{user?.university || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="pt-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
              <div>
                <span className="font-medium text-sm block">Email Notifications</span>
                <span className="text-xs text-muted-foreground">Receive team invitations and chat notifications by email</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
              <div>
                <span className="font-medium text-sm block">Sound Effects</span>
                <span className="text-xs text-muted-foreground">Play gentle audio chimes on incoming chat messages and calls</span>
              </div>
              <input
                type="checkbox"
                checked={chatSounds}
                onChange={(e) => setChatSounds(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 flex items-center gap-3">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Preferences Saved' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

