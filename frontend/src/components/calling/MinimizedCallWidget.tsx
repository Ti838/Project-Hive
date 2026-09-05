'use client';
// ─── ProjectHive — Minimized Call PiP Widget ──────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';
import { Maximize2, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import type { ParticipantTrackItem } from '@/hooks/useLiveKitRoom';
import { getAvatarColor, getInitials, cn } from '@/lib/utils';

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

  const videoElRef = useRef<HTMLVideoElement | null>(null);

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

  const avatar = previewParticipant?.metadata?.avatar;
  const avatarColor =
    previewParticipant?.metadata?.avatar_color ||
    (previewParticipant ? getAvatarColor(previewParticipant.identity) : '#6366F1');

  // Durable callback ref ensuring reliable media attachment on layout switches
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (videoElRef.current && videoElRef.current !== el) {
        if (previewParticipant?.videoTrack?.track) {
          previewParticipant.videoTrack.track.detach(videoElRef.current);
        }
        videoElRef.current.srcObject = null;
      }

      videoElRef.current = el;

      if (el && previewParticipant?.videoTrack?.track && !previewParticipant.isVideoMuted) {
        previewParticipant.videoTrack.track.attach(el);
      }
    },
    [previewParticipant?.videoTrack, previewParticipant?.isVideoMuted]
  );

  // Sync track mute/unmute events without remounting DOM
  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !previewParticipant?.videoTrack?.track) return;

    if (!previewParticipant.isVideoMuted) {
      previewParticipant.videoTrack.track.attach(el);
    } else {
      previewParticipant.videoTrack.track.detach(el);
      el.srcObject = null;
    }
  }, [previewParticipant?.videoTrack, previewParticipant?.isVideoMuted]);

  // Teardown detachment when MinimizedCallWidget unmounts
  useEffect(() => {
    return () => {
      const el = videoElRef.current;
      if (el && previewParticipant?.videoTrack?.track) {
        previewParticipant.videoTrack.track.detach(el);
      }
    };
  }, [previewParticipant?.videoTrack]);

  return (
    <div className="fixed top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 w-72 h-48 z-50 surface-floating rounded-3xl border border-white/15 shadow-2xl p-2.5 flex flex-col justify-between backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 select-none">
      {/* Top status header */}
      <div className="flex items-center justify-between z-10 px-1 pt-0.5">
        <div className="flex items-center gap-2 truncate max-w-[150px]">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              networkQuality === 'reconnecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-emerald-500 animate-pulse'
            )}
          />
          <span className="text-xs font-bold text-white/95 truncate">{title}</span>
        </div>

        <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          {formatDuration(callDurationSeconds)}
        </span>
      </div>

      {/* Center preview */}
      <div className="flex-1 my-1.5 relative rounded-2xl overflow-hidden bg-neutral-900/90 flex items-center justify-center border border-white/5">
        {previewParticipant ? (
          <>
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted={previewParticipant.isLocal}
              className={cn(
                'w-full h-full object-cover',
                previewParticipant.isLocal && 'scale-x-[-1]',
                (previewParticipant.isVideoMuted || !previewParticipant.videoTrack) && 'hidden'
              )}
            />

            {(previewParticipant.isVideoMuted || !previewParticipant.videoTrack) && (
              <div className="flex flex-col items-center justify-center p-2">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={previewParticipant.name}
                    className={cn(
                      'w-10 h-10 rounded-full object-cover border border-white/20',
                      previewParticipant.isSpeaking && 'ring-2 ring-emerald-500 animate-pulse'
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs',
                      previewParticipant.isSpeaking && 'ring-2 ring-emerald-500 animate-pulse'
                    )}
                    style={{ backgroundColor: avatarColor }}
                  >
                    {getInitials(previewParticipant.name)}
                  </div>
                )}
                <span className="text-white/80 text-[10px] font-medium mt-1 truncate max-w-[120px]">
                  {previewParticipant.name}
                </span>
              </div>
            )}

            {/* Speaking dynamic audio ring around PiP preview */}
            {previewParticipant.isSpeaking && (
              <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/80 animate-pulse pointer-events-none glow-primary" />
            )}

            {/* Speaking badge indicator */}
            {previewParticipant.isSpeaking && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Speaking</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/60">
            Connecting audio/video...
          </div>
        )}
      </div>

      {/* Bottom controls with touch ergonomics */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 z-10">
        <button
          onClick={() => setViewMode('fullscreen')}
          className="px-3 py-1.5 min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 tap-press transition-colors font-semibold cursor-pointer"
          title="Expand Call"
          aria-label="Expand Call"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Expand</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={cn(
              'p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-all tap-press cursor-pointer',
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            )}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => endCall(socketEmit)}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 tap-press transition-all border border-rose-400/30 cursor-pointer"
            title="End Call"
            aria-label="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
