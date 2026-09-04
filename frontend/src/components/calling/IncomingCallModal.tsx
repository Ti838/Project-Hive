'use client';
// ─── ProjectHive — Incoming Call Modal ────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Users } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import { getAvatarColor, getInitials, cn } from '@/lib/utils';

export function IncomingCallModal({
  socketEmit,
}: {
  socketEmit?: (event: string, data: any) => void;
}) {
  const { incomingInvite, acceptCall, rejectCall } = useCallStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synthesize pleasant ringing chime using Web Audio API (zero external assets needed)
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();

        const playChime = () => {
          if (!audioContextRef.current) return;
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') ctx.resume();

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
          osc2.frequency.setValueAtTime(554.37, ctx.currentTime); // C#5

          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        };

        playChime();
        ringtoneIntervalRef.current = setInterval(playChime, 3000);
      }
    } catch (_) {}

    return () => {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (!incomingInvite) return null;

  const callerName = incomingInvite.callerName || 'ProjectHive Member';
  const isGroup = !!incomingInvite.isGroup;
  const isVoiceOnly = !!incomingInvite.isVoiceOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-card border border-border/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-5">
        {/* Pulsing Avatar */}
        <div className="relative my-2">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500/50 shadow-xl shadow-emerald-500/25 flex items-center justify-center animate-pulse">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner"
              style={{ backgroundColor: getAvatarColor(incomingInvite.callerId || callerName) }}
            >
              {getInitials(callerName)}
            </div>
          </div>
          <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md animate-bounce">
            {isGroup ? <Users className="w-4 h-4" /> : isVoiceOnly ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-foreground truncate max-w-[260px]">{callerName}</h3>
          <p className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Incoming {isGroup ? 'Team Group Call' : isVoiceOnly ? 'Voice Call' : 'Video Call'}…</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-6 pt-2 w-full">
          {/* Decline */}
          <button
            onClick={() => rejectCall(socketEmit)}
            className="flex flex-col items-center gap-1.5 group tap-press"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={() => acceptCall(socketEmit)}
            className="flex flex-col items-center gap-1.5 group tap-press"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 font-bold">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
