'use client';
// ─── ProjectHive — Minimized Call PiP Widget ──────────────────────────────────

import { Maximize2, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import type { ParticipantTrackItem } from '@/hooks/useLiveKitRoom';
import { ParticipantTile } from './ParticipantTile';
import { cn } from '@/lib/utils';

export function MinimizedCallWidget({
  participants,
  socketEmit,
}: {
  participants: ParticipantTrackItem[];
  socketEmit?: (event: string, data: any) => void;
}) {
  const {
    session,
    callDurationSeconds,
    isMuted,
    networkQuality,
    setViewMode,
    toggleMute,
    endCall,
  } = useCallStore();

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Select primary video tile to preview (remote active speaker or first remote or local)
  const previewParticipant =
    participants.find((p) => !p.isLocal && p.isSpeaking) ||
    participants.find((p) => !p.isLocal) ||
    participants[0];

  const title = session?.targetUser
    ? `${session.targetUser.first_name} ${session.targetUser.last_name}`
    : session?.targetTeam
    ? session.targetTeam.name
    : 'Active Call';

  return (
    <div className="fixed top-4 right-4 sm:top-auto sm:bottom-20 sm:right-4 w-64 h-44 z-50 bg-neutral-950/95 border border-border/80 rounded-2xl shadow-2xl p-2.5 flex flex-col justify-between backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95">
      {/* Top status bar */}
      <div className="flex items-center justify-between z-10 px-1">
        <div className="flex items-center gap-1.5 truncate max-w-[130px]">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              networkQuality === 'reconnecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-emerald-500 animate-pulse'
            )}
          />
          <span className="text-xs font-bold text-white truncate">{title}</span>
        </div>

        <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-md">
          {formatDuration(callDurationSeconds)}
        </span>
      </div>

      {/* Center preview */}
      <div className="flex-1 my-1.5 relative rounded-xl overflow-hidden">
        {previewParticipant ? (
          <ParticipantTile item={previewParticipant} />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/60">
            Connected to room
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 z-10">
        <button
          onClick={() => setViewMode('fullscreen')}
          className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 tap-press transition-colors font-medium"
          title="Expand Call"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Expand</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={cn(
              'p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors tap-press',
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => endCall(socketEmit)}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 tap-press transition-colors"
            title="End Call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
