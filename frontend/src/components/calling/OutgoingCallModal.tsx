'use client';
// ─── ProjectHive — Outgoing Call Modal ────────────────────────────────────────

import { PhoneOff, Video, Phone } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import { getAvatarColor, getInitials, displayName } from '@/lib/utils';

export function OutgoingCallModal({
  socketEmit,
}: {
  socketEmit?: (event: string, data: any) => void;
}) {
  const { session, cancelCall } = useCallStore();

  if (!session) return null;

  const targetName = session.targetUser
    ? displayName(session.targetUser)
    : session.targetTeam
    ? session.targetTeam.name
    : 'Calling...';

  const avatar = session.targetUser?.avatar;
  const avatarColor = session.targetUser ? getAvatarColor(session.targetUser.id) : '#6366F1';
  const isVoice = session.callType === 'audio';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="surface-floating border border-white/15 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Pulsing rings around target avatar */}
        <div className="relative my-3">
          <div className="w-28 h-28 rounded-full border-2 border-primary/40 flex items-center justify-center animate-ping absolute inset-0" />
          <div className="w-28 h-28 rounded-full border-4 border-primary/50 shadow-xl shadow-primary/25 flex items-center justify-center relative">
            {avatar ? (
              <img src={avatar} alt={targetName} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(targetName)}
              </div>
            )}
          </div>
          <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md">
            {isVoice ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </span>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-foreground truncate max-w-[260px]">{targetName}</h3>
          <p className="text-xs text-muted-foreground animate-pulse font-medium">Calling…</p>
        </div>

        {/* Cancel Call Button */}
        <div className="pt-2">
          <button
            onClick={() => cancelCall(socketEmit)}
            className="flex flex-col items-center gap-1.5 group tap-press"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
