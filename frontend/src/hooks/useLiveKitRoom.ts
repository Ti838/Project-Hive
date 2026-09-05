'use client';
// ─── ProjectHive — useLiveKitRoom Hook (WebRTC SFU Media Engine) ──────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  type RemoteParticipant,
  type LocalParticipant,
  type RemoteTrackPublication,
  type LocalTrackPublication,
  type TrackPublication,
  ConnectionQuality,
} from 'livekit-client';
import { useCallStore } from '@/lib/callStore';

export interface ParticipantTrackItem {
  sid: string;
  identity: string;
  name: string;
  isLocal: boolean;
  metadata?: any;
  isSpeaking: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  videoTrack?: TrackPublication | null;
  audioTrack?: TrackPublication | null;
  screenTrack?: TrackPublication | null;
  connectionQuality: ConnectionQuality;
}


// ─── Module-level Singleton State for Media Room Persistence ─────────────────
let roomSingleton: Room | null = null;
let currentSessionToken: string | null = null;
let currentRoomName: string | null = null;

/**
 * Stop all local hardware tracks (camera, microphone, screen share)
 * to release device resources and extinguish browser recording indicators.
 */
export function stopAllLocalTracks(room: Room | null) {
  if (!room) return;
  try {
    const lp = room.localParticipant;
    if (lp) {
      lp.trackPublications.forEach((publication) => {
        try {
          if (publication.track) {
            publication.track.stop();
          }
        } catch (e) {
          console.warn('[LiveKit] Warning stopping local track:', e);
        }
      });
    }
  } catch (err) {
    console.warn('[LiveKit] Warning stopping local tracks:', err);
  }
}

/**
 * Safely disconnect from the LiveKit SFU room and terminate all media tracks.
 */
export async function safelyTeardownRoom(room: Room | null) {
  if (!room) return;
  try {
    stopAllLocalTracks(room);
    if (room.state !== 'disconnected') {
      await room.disconnect(true);
    }
  } catch (err) {
    console.warn('[LiveKit] Error during room teardown:', err);
  }
}

export function useLiveKitRoom() {
  const {
    session,
    status,
    isMuted,
    isVideoOff,
    isScreenSharing,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setStatus,
    setActiveSpeaker,
    setNetworkQuality,
    setDevices,
    setError,
    tickDuration,
  } = useCallStore();

  const [participants, setParticipants] = useState<ParticipantTrackItem[]>([]);
  const [screenSharer, setScreenSharer] = useState<ParticipantTrackItem | null>(null);

  // Sync participants helper
  const updateParticipantList = useCallback((room: Room) => {
    const list: ParticipantTrackItem[] = [];

    // 1. Local Participant
    const lp = room.localParticipant;
    if (lp) {
      let meta: any = null;
      try {
        meta = lp.metadata ? JSON.parse(lp.metadata) : null;
      } catch {}

      const localVideoPub = Array.from(lp.videoTrackPublications.values()).find(
        (p) => p.source === Track.Source.Camera
      );
      const localAudioPub = Array.from(lp.audioTrackPublications.values()).find(
        (p) => p.source === Track.Source.Microphone
      );
      const localScreenPub = Array.from(lp.videoTrackPublications.values()).find(
        (p) => p.source === Track.Source.ScreenShare
      );

      list.push({
        sid: lp.sid || 'local-participant',
        identity: lp.identity,
        name: lp.name || 'You',
        isLocal: true,
        metadata: meta,
        isSpeaking: lp.isSpeaking,
        isAudioMuted: localAudioPub ? localAudioPub.isMuted : true,
        isVideoMuted: localVideoPub ? localVideoPub.isMuted : true,
        videoTrack: localVideoPub,
        audioTrack: localAudioPub,
        screenTrack: localScreenPub,
        connectionQuality: lp.connectionQuality,
      });
    }

    // 2. Remote Participants
    room.remoteParticipants.forEach((rp: RemoteParticipant) => {
      let meta: any = null;
      try {
        meta = rp.metadata ? JSON.parse(rp.metadata) : null;
      } catch {}

      const videoPub = Array.from(rp.videoTrackPublications.values()).find(
        (p) => p.source === Track.Source.Camera
      );
      const audioPub = Array.from(rp.audioTrackPublications.values()).find(
        (p) => p.source === Track.Source.Microphone
      );
      const screenPub = Array.from(rp.videoTrackPublications.values()).find(
        (p) => p.source === Track.Source.ScreenShare
      );

      list.push({
        sid: rp.sid,
        identity: rp.identity,
        name: rp.name || 'Participant',
        isLocal: false,
        metadata: meta,
        isSpeaking: rp.isSpeaking,
        isAudioMuted: audioPub ? audioPub.isMuted : true,
        isVideoMuted: videoPub ? videoPub.isMuted : true,
        videoTrack: videoPub,
        audioTrack: audioPub,
        screenTrack: screenPub,
        connectionQuality: rp.connectionQuality,
      });
    });

    setParticipants(list);

    // Identify if any participant is screen sharing
    const sharer = list.find((p) => p.screenTrack && !p.screenTrack.isMuted);
    setScreenSharer(sharer || null);
  }, []);

  // ── Enumerate Media Devices ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;

    const refreshDevices = async () => {
      try {
        const devices = await Room.getLocalDevices();
        setDevices({
          audioInputs: devices.filter((d) => d.kind === 'audioinput'),
          audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
          videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        });
      } catch (err) {
        console.warn('[LiveKit] Could not enumerate devices:', err);
      }
    };

    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [setDevices]);

  // ── Explicit Teardown on Call Termination ─────────────────────────────────
  useEffect(() => {
    if (status === 'ENDED' || status === 'IDLE' || status === 'FAILED' || status === 'REJECTED') {
      if (roomSingleton) {
        safelyTeardownRoom(roomSingleton);
        roomSingleton = null;
        currentSessionToken = null;
        currentRoomName = null;
        setParticipants([]);
        setScreenSharer(null);
      }
    }
  }, [status]);

  // ── Connect and Manage Room Lifecycle ──────────────────────────────────────
  useEffect(() => {
    // Only connect when session exists and state is ready to join
    if (!session?.token || !session?.livekitUrl) return;
    if (status !== 'CONNECTING' && status !== 'CONNECTED') return;

    // If room singleton is already active for this exact session, reuse it seamlessly
    if (
      roomSingleton &&
      currentSessionToken === session.token &&
      (roomSingleton.state === 'connected' || roomSingleton.state === 'connecting')
    ) {
      updateParticipantList(roomSingleton);
      return;
    }

    let isSubscribed = true;

    // Clean up any existing room before creating a new connection
    if (roomSingleton) {
      safelyTeardownRoom(roomSingleton);
      roomSingleton = null;
      currentSessionToken = null;
      currentRoomName = null;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });

    roomSingleton = room;
    currentSessionToken = session.token;
    currentRoomName = session.roomName;

    const handleSync = () => {
      if (isSubscribed) updateParticipantList(room);
    };

    // Room Event Handlers
    room.on(RoomEvent.Connected, async () => {
      if (!isSubscribed) return;
      console.log('[LiveKit] Connected to SFU room:', room.name);
      setStatus('CONNECTED');

      // Publish mic & camera tracks based on initial settings
      try {
        if (!isMuted) {
          await room.localParticipant.setMicrophoneEnabled(true);
        }
        if (!isVideoOff && session.callType !== 'audio') {
          await room.localParticipant.setCameraEnabled(true);
        }
      } catch (trackErr: any) {
        console.warn('[LiveKit] Device permission warning:', trackErr.message);
      }

      updateParticipantList(room);
    });

    room.on(RoomEvent.ParticipantConnected, handleSync);
    room.on(RoomEvent.ParticipantDisconnected, handleSync);

    room.on(RoomEvent.TrackSubscribed, handleSync);
    room.on(RoomEvent.TrackUnsubscribed, handleSync);
    room.on(RoomEvent.TrackMuted, handleSync);
    room.on(RoomEvent.TrackUnmuted, handleSync);
    room.on(RoomEvent.LocalTrackPublished, handleSync);
    room.on(RoomEvent.LocalTrackUnpublished, handleSync);

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (!isSubscribed) return;
      if (speakers.length > 0) {
        setActiveSpeaker(speakers[0].identity);
      } else {
        setActiveSpeaker(null);
      }
      updateParticipantList(room);
    });

    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (!isSubscribed) return;
      if (participant === room.localParticipant) {
        if (quality === ConnectionQuality.Excellent) setNetworkQuality('excellent');
        else if (quality === ConnectionQuality.Good) setNetworkQuality('good');
        else setNetworkQuality('poor');
      }
      updateParticipantList(room);
    });

    room.on(RoomEvent.Reconnecting, () => {
      if (!isSubscribed) return;
      console.warn('[LiveKit] Room reconnecting...');
      setStatus('RECONNECTING');
      setNetworkQuality('reconnecting');
    });

    room.on(RoomEvent.Reconnected, () => {
      if (!isSubscribed) return;
      console.log('[LiveKit] Room reconnected successfully');
      setStatus('CONNECTED');
      setNetworkQuality('good');
      updateParticipantList(room);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      if (!isSubscribed) return;
      console.log('[LiveKit] Room disconnected:', reason);
      stopAllLocalTracks(room);
      setStatus('ENDED');
    });

    // Execute connection to SFU
    room
      .connect(session.livekitUrl, session.token, {
        autoSubscribe: true,
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error('[LiveKit] Failed to connect to SFU:', err);
        setError('Could not establish connection with media server');
        setStatus('FAILED');
      });

    return () => {
      isSubscribed = false;
      // Do not destroy the singleton on layout switch; teardown is managed by status effect & leaveRoom
    };
  }, [session?.token, session?.livekitUrl, session?.roomName, session?.callType, status]);

  // ── Synchronize Mic Toggle ─────────────────────────────────────────────────
  useEffect(() => {
    const room = roomSingleton;
    if (!room || room.state !== 'connected') return;

    room.localParticipant.setMicrophoneEnabled(!isMuted).catch((err) => {
      console.warn('[LiveKit] Toggle mic error:', err);
    });
  }, [isMuted]);

  // ── Synchronize Camera Toggle ──────────────────────────────────────────────
  useEffect(() => {
    const room = roomSingleton;
    if (!room || room.state !== 'connected') return;

    room.localParticipant.setCameraEnabled(!isVideoOff).catch((err) => {
      console.warn('[LiveKit] Toggle camera error:', err);
    });
  }, [isVideoOff]);

  // ── Synchronize Screen Share Toggle ────────────────────────────────────────
  useEffect(() => {
    const room = roomSingleton;
    if (!room || room.state !== 'connected') return;

    room.localParticipant
      .setScreenShareEnabled(isScreenSharing)
      .catch((err) => {
        console.warn('[LiveKit] Toggle screen share error:', err);
      });
  }, [isScreenSharing]);

  // ── Synchronize Device Switching ───────────────────────────────────────────
  useEffect(() => {
    const room = roomSingleton;
    if (!room) return;

    if (selectedAudioInput) {
      room.switchActiveDevice('audioinput', selectedAudioInput).catch(() => {});
    }
  }, [selectedAudioInput]);

  useEffect(() => {
    const room = roomSingleton;
    if (!room) return;

    if (selectedAudioOutput) {
      room.switchActiveDevice('audiooutput', selectedAudioOutput).catch(() => {});
    }
  }, [selectedAudioOutput]);

  useEffect(() => {
    const room = roomSingleton;
    if (!room) return;

    if (selectedVideoInput) {
      room.switchActiveDevice('videoinput', selectedVideoInput).catch(() => {});
    }
  }, [selectedVideoInput]);

  // ── Call Duration Timer ────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (status === 'CONNECTED') {
      timer = setInterval(() => {
        tickDuration();
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, tickDuration]);

  const leaveRoom = useCallback(async () => {
    if (roomSingleton) {
      await safelyTeardownRoom(roomSingleton);
      roomSingleton = null;
      currentSessionToken = null;
      currentRoomName = null;
      setParticipants([]);
      setScreenSharer(null);
    }
  }, []);

  return {
    room: roomSingleton,
    participants,
    screenSharer,
    leaveRoom,
  };
}
