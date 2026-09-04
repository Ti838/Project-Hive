'use client';
// ─── ProjectHive — Master Call Manager (Global Ambient Component) ─────────────

import { useState, useEffect } from 'react';
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

  const { participants, screenSharer } = useLiveKitRoom();

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
      setTimeout(() => resetCallState(), 2000);
    };

    const onCallHungup = () => {
      console.log('[CallManager] Peer hung up call');
      endCall();
    };

    const onCallError = (err: { message: string }) => {
      console.warn('[CallManager] Call signaling error:', err);
      setError(err.message || 'Call failed');
      setStatus('FAILED');
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
  }, [socket.socket, status, setStatus, endCall, setError, resetCallState]);

  const socketEmit = (event: string, data: any) => {
    socket.socket?.emit(event, data);
  };

  return (
    <>
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
