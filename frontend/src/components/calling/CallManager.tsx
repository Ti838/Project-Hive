'use client';
// ─── ProjectHive — Master Call Manager (Global Ambient Component) ─────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '@/lib/callStore';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import { useSocket, type WhiteboardDrawPayload } from '@/hooks/useSocket';
import { IncomingCallModal } from './IncomingCallModal';
import { OutgoingCallModal } from './OutgoingCallModal';
import { ActiveCallOverlay } from './ActiveCallOverlay';
import { MinimizedCallWidget } from './MinimizedCallWidget';

export function CallManager() {
  const {
    status,
    viewMode,
    session,
    handleIncomingCall,
    setStatus,
    endCall,
    setError,
    resetCallState,
  } = useCallStore();

  const { participants, screenSharer, leaveRoom } = useLiveKitRoom();

  const [whiteboardDrawData, setWhiteboardDrawData] = useState<WhiteboardDrawPayload | null>(null);
  const [whiteboardClearedSignal, setWhiteboardClearedSignal] = useState(false);

  // Wire Socket.IO global event listeners for real-time signaling
  const socket = useSocket({
    onIncomingCall: (event) => {
      console.log('[CallManager] Incoming call notification received:', event);
      handleIncomingCall(event);
    },
    onWhiteboardDraw: (data) => {
      if (data.roomId === session?.roomName) {
        setWhiteboardDrawData(data);
      }
    },
    onWhiteboardClear: () => {
      setWhiteboardClearedSignal(true);
      setTimeout(() => setWhiteboardClearedSignal(false), 50);
    },
  });

  // Automatically ensure clean SFU teardown when call finishes
  useEffect(() => {
    if (status === 'ENDED' || status === 'REJECTED' || status === 'FAILED' || status === 'IDLE') {
      leaveRoom();
    }
  }, [status, leaveRoom]);

  // Handle call lifecycle socket events
  useEffect(() => {
    const rawSocket = socket.socket;
    if (!rawSocket) return;

    const onCallAccepted = (data: { roomId: string }) => {
      console.log('[CallManager] Peer accepted call:', data);
      if (status === 'CALLING') {
        setStatus('CONNECTING');
      }
    };

    const onCallDeclined = () => {
      console.log('[CallManager] Peer declined call');
      setStatus('REJECTED');
      leaveRoom();
      setTimeout(() => resetCallState(), 2000);
    };

    const onCallHungup = () => {
      console.log('[CallManager] Peer hung up call');
      leaveRoom();
      endCall();
    };

    const onCallError = (err: { message: string }) => {
      console.warn('[CallManager] Call signaling error:', err);
      setError(err.message || 'Call failed');
      setStatus('FAILED');
      leaveRoom();
      setTimeout(() => resetCallState(), 3000);
    };

    rawSocket.on('call:accepted', onCallAccepted);
    rawSocket.on('call:declined', onCallDeclined);
    rawSocket.on('call:hungup', onCallHungup);
    rawSocket.on('call:error', onCallError);

    return () => {
      rawSocket.off('call:accepted', onCallAccepted);
      rawSocket.off('call:declined', onCallDeclined);
      rawSocket.off('call:hungup', onCallHungup);
      rawSocket.off('call:error', onCallError);
    };
  }, [socket.socket, status, setStatus, endCall, leaveRoom, setError, resetCallState]);

  const socketEmit = (event: string, data: any) => {
    socket.socket?.emit(event, data);
  };

  return (
    <>
      {/* Persistent Audio Engine — guarantees uninterrupted audio across Fullscreen & PiP */}
      {participants
        .filter((p) => !p.isLocal && p.audioTrack && !p.isAudioMuted)
        .map((p) => (
          <RemoteAudioRenderer key={`audio-${p.sid}`} track={p.audioTrack} />
        ))}

      {/* Incoming Call Ringing Modal */}
      {status === 'RINGING' && <IncomingCallModal socketEmit={socketEmit} />}

      {/* Outgoing Call Dialing Modal */}
      {status === 'CALLING' && <OutgoingCallModal socketEmit={socketEmit} />}

      {/* Active Call: Minimized Picture-in-Picture Floating Window */}
      {(status === 'CONNECTING' || status === 'CONNECTED' || status === 'RECONNECTING') &&
        viewMode === 'minimized' && (
          <MinimizedCallWidget participants={participants} socketEmit={socketEmit} />
        )}

      {/* Active Call: Fullscreen / Modal Calling Overlay */}
      {(status === 'CONNECTING' || status === 'CONNECTED' || status === 'RECONNECTING') &&
        viewMode !== 'minimized' && (
          <ActiveCallOverlay
            participants={participants}
            screenSharer={screenSharer}
            socketEmit={socketEmit}
            whiteboardDrawData={whiteboardDrawData}
            whiteboardClearedSignal={whiteboardClearedSignal}
          />
        )}
    </>
  );
}

// ── Persistent Remote Audio Output ──────────────────────────────────────────
function RemoteAudioRenderer({ track }: { track?: any }) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const setAudioRef = useCallback(
    (el: HTMLAudioElement | null) => {
      if (audioElRef.current && audioElRef.current !== el) {
        if (track?.track) {
          track.track.detach(audioElRef.current);
        }
      }
      audioElRef.current = el;
      if (el && track?.track) {
        track.track.attach(el);
      }
    },
    [track]
  );

  useEffect(() => {
    return () => {
      const el = audioElRef.current;
      if (el && track?.track) {
        track.track.detach(el);
      }
    };
  }, [track]);

  return <audio ref={setAudioRef} autoPlay playsInline className="hidden" />;
}

