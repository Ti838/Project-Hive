'use client';
// ─── ProjectHive — Screen Share View ──────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { Monitor, X } from 'lucide-react';
import type { ParticipantTrackItem } from '@/hooks/useLiveKitRoom';
import { useCallStore } from '@/lib/callStore';

export function ScreenShareView({ sharer }: { sharer: ParticipantTrackItem }) {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const { toggleScreenShare } = useCallStore();

  // Durable callback ref for attaching LiveKit screen share track
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (videoElRef.current && videoElRef.current !== el) {
        if (sharer.screenTrack?.track) {
          sharer.screenTrack.track.detach(videoElRef.current);
        }
        videoElRef.current.srcObject = null;
      }

      videoElRef.current = el;

      if (el && sharer.screenTrack?.track) {
        sharer.screenTrack.track.attach(el);
      }
    },
    [sharer.screenTrack]
  );

  useEffect(() => {
    return () => {
      const el = videoElRef.current;
      if (el && sharer.screenTrack?.track) {
        sharer.screenTrack.track.detach(el);
      }
    };
  }, [sharer.screenTrack]);

  return (
    <div className="relative w-full h-full bg-black/95 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
      <video ref={setVideoRef} autoPlay playsInline className="w-full h-full object-contain" />

      {/* Presenter Banner */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white">
        <Monitor className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold">{sharer.isLocal ? 'You are sharing your screen' : `${sharer.name}'s screen`}</span>
      </div>

      {/* Stop Sharing Button (if local) */}
      {sharer.isLocal && (
        <button
          onClick={toggleScreenShare}
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg tap-press transition-all"
        >
          <X className="w-3.5 h-3.5" />
          <span>Stop Sharing</span>
        </button>
      )}
    </div>
  );
}
