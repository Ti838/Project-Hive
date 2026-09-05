'use client';
// ─── ProjectHive — Studio-Grade Video Tile ────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { MicOff, Wifi, WifiOff } from 'lucide-react';
import { ConnectionQuality } from 'livekit-client';
import type { ParticipantTrackItem } from '@/hooks/useLiveKitRoom';
import { getAvatarColor, getInitials, cn } from '@/lib/utils';

export function ParticipantTile({
  item,
  isMainStage = false,
}: {
  item: ParticipantTrackItem;
  isMainStage?: boolean;
}) {
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Durable callback ref for attaching LiveKit video track
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (videoElRef.current && videoElRef.current !== el) {
        if (item.videoTrack?.track) {
          item.videoTrack.track.detach(videoElRef.current);
        }
        videoElRef.current.srcObject = null;
      }

      videoElRef.current = el;

      if (el && item.videoTrack?.track && !item.isVideoMuted) {
        item.videoTrack.track.attach(el);
      }
    },
    [item.videoTrack, item.isVideoMuted]
  );

  // Handle mute/track updates while the element is mounted
  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !item.videoTrack?.track) return;

    if (!item.isVideoMuted) {
      item.videoTrack.track.attach(el);
    } else {
      item.videoTrack.track.detach(el);
      el.srcObject = null;
    }
  }, [item.videoTrack, item.isVideoMuted]);

  // Teardown detachment on unmount
  useEffect(() => {
    return () => {
      const el = videoElRef.current;
      if (el && item.videoTrack?.track) {
        item.videoTrack.track.detach(el);
      }
    };
  }, [item.videoTrack]);

  const avatar = item.metadata?.avatar;
  const avatarColor = item.metadata?.avatar_color || getAvatarColor(item.identity);

  // Network quality color indicator
  const getQualityColor = () => {
    switch (item.connectionQuality) {
      case ConnectionQuality.Excellent:
        return 'text-emerald-400';
      case ConnectionQuality.Good:
        return 'text-emerald-500';
      case ConnectionQuality.Poor:
        return 'text-amber-400';
      case ConnectionQuality.Lost:
        return 'text-rose-400';
      default:
        return 'text-white/40';
    }
  };

  return (
    <div
      className={cn(
        'group relative w-full h-full aspect-video max-h-full rounded-2xl sm:rounded-3xl overflow-hidden flex items-center justify-center transition-all duration-300',
        'bg-zinc-950/90 border border-white/10 shadow-2xl',
        item.isSpeaking && 'ring-2 ring-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] glow-primary',
        isMainStage ? 'min-h-[280px] sm:min-h-[380px]' : 'min-h-[160px]'
      )}
    >
      {/* Dynamic breathing audio glow ring around active speaker */}
      {item.isSpeaking && (
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none ring-2 ring-emerald-400/80 animate-pulse glow-primary z-10" />
      )}

      {/* Video Element with 16:9 safe-zone object-cover */}
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted={item.isLocal}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          item.isLocal && 'scale-x-[-1]', // Mirror local camera preview
          (item.isVideoMuted || !item.videoTrack) && 'hidden'
        )}
      />

      {/* Avatar Fallback (when video is disabled or muted) */}
      {(item.isVideoMuted || !item.videoTrack) && (
        <div className="flex flex-col items-center justify-center p-4 z-10">
          <div className="relative mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={item.name}
                className={cn(
                  'rounded-full object-cover border-2 border-white/15 shadow-2xl transition-all',
                  isMainStage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20',
                  item.isSpeaking && 'ring-4 ring-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse'
                )}
              />
            ) : (
              <div
                className={cn(
                  'rounded-full flex items-center justify-center text-white font-bold shadow-2xl transition-all',
                  isMainStage ? 'w-24 h-24 text-2xl sm:w-28 sm:h-28 sm:text-3xl' : 'w-16 h-16 text-lg sm:w-20 sm:h-20 sm:text-xl',
                  item.isSpeaking && 'ring-4 ring-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse'
                )}
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(item.name)}
              </div>
            )}
            {item.isSpeaking && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-900 animate-ping" />
            )}
          </div>
          <p className="text-white font-semibold text-sm truncate max-w-[180px] drop-shadow-md">{item.name}</p>
          <span className="text-[11px] text-white/50 font-medium mt-0.5">Camera off</span>
        </div>
      )}

      {/* Micro-Overlay Chips using .surface-floating */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Participant Name & Mic Status Pill */}
        <div className="surface-floating px-3 py-1 rounded-full text-xs font-medium text-white/95 border border-white/10 shadow-xl flex items-center gap-2 backdrop-blur-xl">
          <span className="truncate max-w-[140px] tracking-tight font-semibold">
            {item.isLocal ? `${item.name} (You)` : item.name}
          </span>
          {item.isAudioMuted ? (
            <span className="p-0.5 rounded-full bg-rose-500/25 text-rose-400 border border-rose-500/30" title="Muted">
              <MicOff className="w-3 h-3" />
            </span>
          ) : item.isSpeaking ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          ) : null}
        </div>

        {/* Signal Quality Pill */}
        <div
          className="surface-floating px-2 py-1 rounded-full border border-white/10 shadow-xl flex items-center gap-1.5 backdrop-blur-xl"
          title={`Network Quality: ${item.connectionQuality}`}
        >
          {item.connectionQuality === ConnectionQuality.Lost ? (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Wifi className={cn('w-3.5 h-3.5', getQualityColor())} />
          )}
        </div>
      </div>
    </div>
  );
}
