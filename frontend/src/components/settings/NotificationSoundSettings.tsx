'use client';

import React from 'react';
import { Volume2, VolumeX, Play, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { soundEngine, type SoundPack } from '@/lib/soundEngine';

interface NotificationSoundSettingsProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundPack: SoundPack;
  setSoundPack: (pack: SoundPack) => void;
  soundVolume: number;
  setSoundVolume: (vol: number) => void;
  emailNotifications: boolean;
  directMessageAlerts: boolean;
  mentionPings: boolean;
  handleUpdateSetting: (key: string, value: any) => void;
}

export function NotificationSoundSettings({
  soundEnabled,
  setSoundEnabled,
  soundPack,
  setSoundPack,
  soundVolume,
  setSoundVolume,
  emailNotifications,
  directMessageAlerts,
  mentionPings,
  handleUpdateSetting,
}: NotificationSoundSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Main Sound Engine Card */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" /> Live Notification Audio Chimes
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time procedural Web Audio chimes inspired by Discord and Facebook. Zero latency, works offline.
            </p>
          </div>
          <span
            className={cn(
              'text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5',
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border/40'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                soundEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
              )}
            />
            {soundEnabled ? 'Live Audio Active' : 'Muted'}
          </span>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                soundEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-medium text-sm block">Master Sound Effects</span>
              <span className="text-xs text-muted-foreground">
                Play acoustic chimes on incoming messages, friend requests & pings
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setSoundEnabled(next);
                if (next) soundEngine?.test('notification');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Sound Packs Grid */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Choose Sound Signature
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pack 1: Cyber Hive */}
            <div
              onClick={() => {
                setSoundPack('hive');
                soundEngine?.test('notification', 'hive');
              }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between',
                soundPack === 'hive'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border/60 bg-card hover:bg-muted/40'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm flex items-center gap-1.5">🐝 Cyber Hive</span>
                  {soundPack === 'hive' && (
                    <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Harmonic acoustic marimba & celestial honeycomb chime.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine?.test('notification', 'hive');
                }}
                className="w-full py-1.5 px-2 bg-muted/80 hover:bg-muted text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-primary fill-primary" /> Preview Chime
              </button>
            </div>

            {/* Pack 2: Discord Neo */}
            <div
              onClick={() => {
                setSoundPack('discord');
                soundEngine?.test('notification', 'discord');
              }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between',
                soundPack === 'discord'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border/60 bg-card hover:bg-muted/40'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm flex items-center gap-1.5">🎮 Discord Neo</span>
                  {soundPack === 'discord' && (
                    <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Crisp dual resonant crystal tone & iconic message bloop.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine?.test('notification', 'discord');
                }}
                className="w-full py-1.5 px-2 bg-muted/80 hover:bg-muted text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-primary fill-primary" /> Preview Chime
              </button>
            </div>

            {/* Pack 3: Facebook Minimal */}
            <div
              onClick={() => {
                setSoundPack('minimal');
                soundEngine?.test('notification', 'minimal');
              }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between',
                soundPack === 'minimal'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border/60 bg-card hover:bg-muted/40'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm flex items-center gap-1.5">⚡ Facebook Minimal</span>
                  {soundPack === 'minimal' && (
                    <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Soft subtle bubble pop & minimal desktop marimba tap.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine?.test('notification', 'minimal');
                }}
                className="w-full py-1.5 px-2 bg-muted/80 hover:bg-muted text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-primary fill-primary" /> Preview Chime
              </button>
            </div>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" /> Master Chime Volume
            </span>
            <span className="text-xs font-bold text-primary tabular-nums">{Math.round(soundVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={soundVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSoundVolume(val);
            }}
            onMouseUp={() => soundEngine?.test('notification')}
            onTouchEnd={() => soundEngine?.test('notification')}
            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Interactive Soundboard Tester */}
        <div className="space-y-2.5 pt-2 border-t border-border/40">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Interactive Soundboard (Test Live Audio Cues)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => soundEngine?.test('notification')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">🔔 Notification</span>
                <span className="text-[10px] text-muted-foreground">System & alerts</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => soundEngine?.test('message')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">💬 Direct Message</span>
                <span className="text-[10px] text-muted-foreground">Classmate chat</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => soundEngine?.test('reaction')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">✨ Reaction Sparkle</span>
                <span className="text-[10px] text-muted-foreground">Likes & emojis</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => soundEngine?.test('friend')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">🤝 Connection Triad</span>
                <span className="text-[10px] text-muted-foreground">Friend requests</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => soundEngine?.test('mention')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">@ Squad Mention</span>
                <span className="text-[10px] text-muted-foreground">Teammate pings</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => soundEngine?.test('call')}
              className="p-2.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="text-xs">
                <span className="font-medium block">📞 Incoming Call</span>
                <span className="text-[10px] text-muted-foreground">Vibraphone chime</span>
              </div>
              <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Delivery & Routing Card */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Delivery & Channels
          </h2>
          <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
            Synced to Cloud Profile
          </span>
        </div>

        <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
          <div>
            <span className="font-medium text-sm block">Email Alerts</span>
            <span className="text-xs text-muted-foreground">
              Receive team invites, security notices, and critical project digests
            </span>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => handleUpdateSetting('emailNotifications', e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
          <div>
            <span className="font-medium text-sm block">Direct Message Banner Alerts</span>
            <span className="text-xs text-muted-foreground">
              Show in-app banner toast when receiving messages from classmates
            </span>
          </div>
          <input
            type="checkbox"
            checked={directMessageAlerts}
            onChange={(e) => handleUpdateSetting('directMessageAlerts', e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
          <div>
            <span className="font-medium text-sm block">Mention & Squad Pings</span>
            <span className="text-xs text-muted-foreground">
              Notify when teammates @mention you in discussions or squad tasks
            </span>
          </div>
          <input
            type="checkbox"
            checked={mentionPings}
            onChange={(e) => handleUpdateSetting('mentionPings', e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

