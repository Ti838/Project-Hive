'use client';
// ─── ProjectHive — Active Call Overlay (Studio-Grade LiveKit SFU) ─────────────

import { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Settings,
  Presentation,
  Minimize2,
  PhoneOff,
  Users,
  WifiOff,
} from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import type { ParticipantTrackItem } from '@/hooks/useLiveKitRoom';
import { ParticipantTile } from './ParticipantTile';
import { ScreenShareView } from './ScreenShareView';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import { InCallWhiteboard } from '@/components/chat/InCallWhiteboard';
import { cn } from '@/lib/utils';

export function ActiveCallOverlay({
  participants,
  screenSharer,
  socketEmit,
  whiteboardDrawData,
  whiteboardClearedSignal,
}: {
  participants: ParticipantTrackItem[];
  screenSharer: ParticipantTrackItem | null;
  socketEmit?: (event: string, data: any) => void;
  whiteboardDrawData?: any;
  whiteboardClearedSignal?: boolean;
}) {
  const {
    session,
    callDurationSeconds,
    networkQuality,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isWhiteboardOpen,
    setViewMode,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleWhiteboard,
    endCall,
  } = useCallStore();

  const [showSettings, setShowSettings] = useState(false);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const title = session?.targetUser
    ? `${session.targetUser.first_name} ${session.targetUser.last_name}`
    : session?.targetTeam
    ? session.targetTeam.name
    : session?.targetProject
    ? session.targetProject.title
    : 'LiveKit Room';

  // Responsive Grid Class based on participant count
  const getGridClass = () => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1 max-w-2xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-6xl';
    return 'grid-cols-2 md:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200 overflow-hidden">
      {/* ─── Top Control Bar ──────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-xs">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                networkQuality === 'reconnecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-emerald-500 animate-pulse'
              )}
            />
            <span>{formatDuration(callDurationSeconds)}</span>
          </div>

          <div className="text-white/90 text-sm font-medium hidden sm:flex items-center gap-2">
            <span className="text-muted-foreground text-xs">🔒 Encrypted SFU Room:</span>
            <span className="font-semibold text-white truncate max-w-[220px]">{title}</span>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center bg-white/10 rounded-full p-1 border border-white/10 text-xs shadow-inner">
          <button
            onClick={() => isWhiteboardOpen && toggleWhiteboard()}
            className={cn(
              'px-3.5 py-1.5 rounded-full font-medium transition-all tap-press cursor-pointer',
              !isWhiteboardOpen
                ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                : 'text-white/70 hover:text-white'
            )}
          >
            Video Grid ({participants.length})
          </button>
          <button
            onClick={() => !isWhiteboardOpen && toggleWhiteboard()}
            className={cn(
              'px-3.5 py-1.5 rounded-full font-medium transition-all tap-press flex items-center gap-1.5 cursor-pointer',
              isWhiteboardOpen
                ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                : 'text-white/70 hover:text-white'
            )}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('minimized')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors tap-press cursor-pointer"
            title="Minimize to Picture-in-Picture"
            aria-label="Minimize to Picture-in-Picture"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Network Warning Banner ───────────────────────────────────────── */}
      {networkQuality === 'reconnecting' && (
        <div className="my-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm animate-pulse shrink-0">
          <WifiOff className="w-4 h-4" />
          <span className="font-medium">Unstable network connection. Reconnecting to LiveKit SFU…</span>
        </div>
      )}

      {/* ─── Main Viewport (with bottom padding for floating dock) ─────────── */}
      <div className="flex-1 w-full my-2 sm:my-3 relative flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl pb-20 sm:pb-24">
        {isWhiteboardOpen ? (
          /* Whiteboard Mode */
          <div className="relative w-full h-full flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <InCallWhiteboard
              roomId={session?.roomName || 'default-room'}
              onEmitDraw={(data) => socketEmit?.('whiteboard:draw', data)}
              onEmitClear={() => socketEmit?.('whiteboard:clear', { roomId: session?.roomName })}
              remoteDrawEvent={whiteboardDrawData}
              remoteClearEvent={whiteboardClearedSignal}
            />

            {/* Floating corner participant indicator */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-xl pointer-events-none">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-white/90 font-medium">{participants.length} in room</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        ) : screenSharer ? (
          /* Screen Share Mode: Screen presentation in stage + participant filmstrip */
          <div className="w-full h-full flex flex-col gap-3">
            <div className="flex-1 min-h-0">
              <ScreenShareView sharer={screenSharer} />
            </div>
            {/* Filmstrip of participants */}
            <div className="h-28 sm:h-32 flex items-center gap-2.5 overflow-x-auto py-1 shrink-0">
              {participants.map((p) => (
                <div key={p.sid || p.identity} className="w-40 h-full shrink-0">
                  <ParticipantTile item={p} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Responsive Participant Grid */
          <div className="w-full h-full flex items-center justify-center overflow-y-auto">
            <div
              className={cn(
                'w-full h-full grid gap-3 sm:gap-4 items-center justify-center p-2',
                getGridClass()
              )}
            >
              {participants.map((p) => (
                <ParticipantTile
                  key={p.sid || p.identity}
                  item={p}
                  isMainStage={participants.length === 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Floating Frosted-Glass Pill Control Dock ─────────────────────── */}
      <div className="fixed bottom-5 sm:bottom-6 inset-x-0 mx-auto w-fit z-40 px-3 sm:px-5 py-2 sm:py-2.5 surface-floating rounded-full border border-white/10 shadow-2xl flex items-center gap-2 sm:gap-3.5 backdrop-blur-2xl pb-[max(0.5rem,env(safe-area-inset-bottom,8px))]">
        {/* Mic Toggle */}
        <button
          onClick={toggleMute}
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all tap-press cursor-pointer',
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          )}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all tap-press cursor-pointer',
            isVideoOff
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          )}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          aria-label={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all tap-press cursor-pointer',
            isScreenSharing
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 glow-primary border border-primary/50'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          )}
          title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
          aria-label={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={toggleWhiteboard}
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all tap-press cursor-pointer',
            isWhiteboardOpen
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 glow-primary border border-primary/50'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          )}
          title={isWhiteboardOpen ? 'Exit Whiteboard' : 'Open In-Call Whiteboard'}
          aria-label={isWhiteboardOpen ? 'Exit Whiteboard' : 'Open In-Call Whiteboard'}
        >
          <Presentation className="w-5 h-5" />
        </button>

        {/* Device Settings Modal Toggle */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center tap-press transition-colors cursor-pointer"
          title="Audio & Video Settings"
          aria-label="Audio & Video Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Dedicated Crimson End Call Button with shadow glow */}
        <button
          onClick={() => endCall(socketEmit)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center tap-press shadow-lg shadow-rose-900/30 transition-all border border-rose-400/40 ml-1 cursor-pointer"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Device Settings Modal */}
      {showSettings && <DeviceSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
