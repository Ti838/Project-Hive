'use client';
// ─── ProjectHive — Participant Video Tile ─────────────────────────────────────

import { useEffect, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Attach video track
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (item.videoTrack && !item.isVideoMuted) {
      item.videoTrack.track?.attach(el);
    } else {
      item.videoTrack?.track?.detach(el);
      el.srcObject = null;
    }

    return () => {
      if (el) item.videoTrack?.track?.detach(el);
    };
  }, [item.videoTrack, item.isVideoMuted]);

  // Attach audio track for remote participants
  useEffect(() => {
    const el = audioRef.current;
    if (!el || item.isLocal) return;

    if (item.audioTrack && !item.isAudioMuted) {
      item.audioTrack.track?.attach(el);
    } else {
      item.audioTrack?.track?.detach(el);
      el.srcObject = null;
    }

    return () => {
      if (el) item.audioTrack?.track?.detach(el);
    };
  }, [item.audioTrack, item.isAudioMuted, item.isLocal]);

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
        'relative w-full h-full bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200',
        item.isSpeaking && 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/20',
        isMainStage ? 'min-h-[300px]' : 'min-h-[160px]'
      )}
    >
      {/* Remote audio output */}
      {!item.isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={item.isLocal}
        className={cn(
          'w-full h-full object-cover',
          item.isLocal && 'scale-x-[-1]', // Mirror local camera preview
          (item.isVideoMuted || !item.videoTrack) && 'hidden'
        )}
      />

      {/* Avatar Fallback (when video is disabled or muted) */}
      {(item.isVideoMuted || !item.videoTrack) && (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={item.name}
                className={cn(
                  'rounded-full object-cover border-2 border-white/10',
                  isMainStage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20',
                  item.isSpeaking && 'ring-4 ring-emerald-500/50 animate-pulse'
                )}
              />
            ) : (
              <div
                className={cn(
                  'rounded-full flex items-center justify-center text-white font-bold',
                  isMainStage ? 'w-24 h-24 text-2xl sm:w-28 sm:h-28 sm:text-3xl' : 'w-16 h-16 text-lg sm:w-20 sm:h-20 sm:text-xl',
                  item.isSpeaking && 'ring-4 ring-emerald-500/50 animate-pulse'
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
          <p className="text-white/90 text-sm font-semibold truncate max-w-[180px]">{item.name}</p>
        </div>
      )}

      {/* Bottom Info Pill */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white/90 shadow-md">
          <span className="truncate max-w-[120px]">{item.isLocal ? `${item.name} (You)` : item.name}</span>
          {item.isAudioMuted && (
            <span className="p-0.5 rounded-full bg-rose-500/20 text-rose-400">
              <MicOff className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Signal Bars */}
        <div className="bg-black/65 backdrop-blur-md px-1.5 py-1 rounded-full flex items-center">
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
