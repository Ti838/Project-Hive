'use client';
// ─── ProjectHive — Hardware Device Settings Modal ─────────────────────────────

import { X, Mic, Volume2, Video } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';

export function DeviceSettingsModal({ onClose }: { onClose: () => void }) {
  const {
    availableDevices,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setAudioInput,
    setAudioOutput,
    setVideoInput,
  } = useCallStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <h3 className="font-bold text-base text-foreground">Audio & Video Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent tap-press transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Microphone Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span>Microphone</span>
          </label>
          <select
            value={selectedAudioInput}
            onChange={(e) => setAudioInput(e.target.value)}
            className="w-full h-10 bg-muted/60 rounded-xl px-3 text-xs border border-border/60 focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">Default System Microphone</option>
            {availableDevices.audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Speakers / Audio Output */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span>Speakers / Headphones</span>
          </label>
          <select
            value={selectedAudioOutput}
            onChange={(e) => setAudioOutput(e.target.value)}
            className="w-full h-10 bg-muted/60 rounded-xl px-3 text-xs border border-border/60 focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">Default System Speaker</option>
            {availableDevices.audioOutputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-primary" />
            <span>Camera</span>
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            className="w-full h-10 bg-muted/60 rounded-xl px-3 text-xs border border-border/60 focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">Default System Camera</option>
            {availableDevices.videoInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl tap-press hover:bg-primary/90 transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
