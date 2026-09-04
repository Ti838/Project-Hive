'use client';
// ─── ProjectHive — Call Store (Zustand Global State) ───────────────────────────

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User, Team, Project, CallEvent } from '@/types';

export type CallStatus =
  | 'IDLE'
  | 'CALLING'      // Outgoing call: waiting for peer to answer
  | 'RINGING'      // Incoming call: ringing on receiver's device
  | 'CONNECTING'   // Joining LiveKit SFU room
  | 'CONNECTED'    // Live in the call room
  | 'RECONNECTING' // Temporary network drop / reconnecting
  | 'ENDED'        // Call finished
  | 'REJECTED'     // Peer declined or busy
  | 'MISSED'       // Timeout / no answer
  | 'FAILED';      // Hardware or connection error

export type CallViewMode = 'fullscreen' | 'modal' | 'minimized';

export interface CallSession {
  roomName: string;
  livekitUrl: string;
  token: string;
  callType: 'audio' | 'video';
  scope: 'direct' | 'team' | 'project';
  targetId?: string;
  targetUser?: User | null;
  targetTeam?: Team | null;
  targetProject?: Project | null;
  caller?: { id: string; name: string; avatar?: string };
  isInitiator: boolean;
  startedAt?: number;
}

export interface DeviceInfoList {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

interface CallStoreState {
  status: CallStatus;
  viewMode: CallViewMode;
  session: CallSession | null;
  incomingInvite: (CallEvent & { callerAvatar?: string; teamName?: string }) | null;
  errorMessage: string | null;

  // Media Track Toggles
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isWhiteboardOpen: boolean;

  // Telemetry & Active Speaker
  activeSpeakerId: string | null;
  networkQuality: 'excellent' | 'good' | 'poor' | 'reconnecting';
  callDurationSeconds: number;

  // Hardware Devices
  selectedAudioInput: string;
  selectedAudioOutput: string;
  selectedVideoInput: string;
  availableDevices: DeviceInfoList;

  // Actions
  startCall: (params: {
    scope: 'direct' | 'team' | 'project';
    targetId: string;
    callType: 'audio' | 'video';
    targetUser?: User | null;
    targetTeam?: Team | null;
    targetProject?: Project | null;
    socketEmit?: (event: string, data: any) => void;
  }) => Promise<boolean>;

  handleIncomingCall: (event: CallEvent) => void;
  acceptCall: (socketEmit?: (event: string, data: any) => void) => Promise<boolean>;
  rejectCall: (socketEmit?: (event: string, data: any) => void) => void;
  cancelCall: (socketEmit?: (event: string, data: any) => void) => void;
  endCall: (socketEmit?: (event: string, data: any) => void) => void;

  setViewMode: (mode: CallViewMode) => void;
  setStatus: (status: CallStatus) => void;
  setSession: (session: CallSession | null) => void;
  setError: (msg: string | null) => void;

  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleWhiteboard: () => void;

  setActiveSpeaker: (id: string | null) => void;
  setNetworkQuality: (q: 'excellent' | 'good' | 'poor' | 'reconnecting') => void;
  tickDuration: () => void;

  setDevices: (devices: DeviceInfoList) => void;
  setAudioInput: (deviceId: string) => void;
  setAudioOutput: (deviceId: string) => void;
  setVideoInput: (deviceId: string) => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallStoreState>()((set, get) => ({
  status: 'IDLE',
  viewMode: 'modal',
  session: null,
  incomingInvite: null,
  errorMessage: null,

  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isWhiteboardOpen: false,

  activeSpeakerId: null,
  networkQuality: 'good',
  callDurationSeconds: 0,

  selectedAudioInput: '',
  selectedAudioOutput: '',
  selectedVideoInput: '',
  availableDevices: { audioInputs: [], audioOutputs: [], videoInputs: [] },

  // ── Start Call ─────────────────────────────────────────────────────────────
  startCall: async ({ scope, targetId, callType, targetUser, targetTeam, targetProject, socketEmit }) => {
    try {
      set({
        status: scope === 'direct' ? 'CALLING' : 'CONNECTING',
        viewMode: 'modal',
        errorMessage: null,
        isMuted: false,
        isVideoOff: callType === 'audio',
        isScreenSharing: false,
        isWhiteboardOpen: false,
        callDurationSeconds: 0,
      });

      const res = await api.calls.getToken({
        scope,
        targetId,
        callType,
      });

      if (!res.ok || !res.token) {
        set({ status: 'FAILED', errorMessage: res.error || 'Could not initiate call session' });
        setTimeout(() => get().resetCallState(), 3000);
        return false;
      }

      const session: CallSession = {
        roomName: res.roomName,
        livekitUrl: res.livekitUrl,
        token: res.token,
        callType: res.callType,
        scope: res.scope as any,
        targetId,
        targetUser,
        targetTeam,
        targetProject,
        caller: res.caller,
        isInitiator: true,
        startedAt: Date.now(),
      };

      set({ session });

      // Signal remote party via Socket.IO
      if (socketEmit) {
        if (scope === 'direct') {
          socketEmit('call:initiate', {
            roomId: res.roomName,
            targetId,
            callerName: res.caller.name,
            isWebRTC: true,
            isVoiceOnly: callType === 'audio',
          });
        } else if (scope === 'team') {
          socketEmit('call:group', {
            roomId: res.roomName,
            teamId: targetId,
            callerName: res.caller.name,
          });
          // Team calls enter CONNECTING right away
          set({ status: 'CONNECTING' });
        }
      }

      return true;
    } catch (err: any) {
      console.error('[CallStore] startCall error:', err);
      set({ status: 'FAILED', errorMessage: err.message || 'Call initiation failed' });
      setTimeout(() => get().resetCallState(), 3000);
      return false;
    }
  },

  // ── Receive Incoming Call ──────────────────────────────────────────────────
  handleIncomingCall: (event) => {
    // If user is already active in another call, decline or ignore
    if (get().status === 'CONNECTED' || get().status === 'CONNECTING') {
      return;
    }

    set({
      status: 'RINGING',
      incomingInvite: event,
      errorMessage: null,
      viewMode: 'modal',
      isVideoOff: !!event.isVoiceOnly,
      callDurationSeconds: 0,
    });
  },

  // ── Accept Incoming Call ───────────────────────────────────────────────────
  acceptCall: async (socketEmit) => {
    const invite = get().incomingInvite;
    if (!invite) return false;

    set({ status: 'CONNECTING', errorMessage: null });

    try {
      const scope = invite.isGroup ? 'team' : 'direct';
      const targetId = invite.isGroup ? invite.teamId : invite.callerId;

      const res = await api.calls.getToken({
        scope,
        targetId,
        roomName: invite.roomId,
        callType: invite.isVoiceOnly ? 'audio' : 'video',
      });

      if (!res.ok || !res.token) {
        set({ status: 'FAILED', errorMessage: res.error || 'Failed to join call' });
        setTimeout(() => get().resetCallState(), 3000);
        return false;
      }

      const session: CallSession = {
        roomName: res.roomName,
        livekitUrl: res.livekitUrl,
        token: res.token,
        callType: res.callType,
        scope: res.scope as any,
        targetId: invite.callerId,
        isInitiator: false,
        startedAt: Date.now(),
      };

      set({ session, incomingInvite: null });

      // Signal back to caller that call was accepted
      if (socketEmit && invite.callerId) {
        socketEmit('call:accept', {
          roomId: invite.roomId,
          targetId: invite.callerId,
        });
      }

      return true;
    } catch (err: any) {
      console.error('[CallStore] acceptCall error:', err);
      set({ status: 'FAILED', errorMessage: err.message || 'Could not connect to call room' });
      setTimeout(() => get().resetCallState(), 3000);
      return false;
    }
  },

  // ── Reject Incoming Call ───────────────────────────────────────────────────
  rejectCall: (socketEmit) => {
    const invite = get().incomingInvite;
    if (invite && socketEmit && invite.callerId) {
      socketEmit('call:decline', {
        roomId: invite.roomId,
        targetId: invite.callerId,
      });
    }
    set({ status: 'REJECTED', incomingInvite: null });
    setTimeout(() => get().resetCallState(), 1200);
  },

  // ── Cancel Outgoing Call ───────────────────────────────────────────────────
  cancelCall: (socketEmit) => {
    const session = get().session;
    if (session && socketEmit && session.targetId) {
      socketEmit('call:hangup', {
        roomId: session.roomName,
        targetId: session.targetId,
      });
    }
    set({ status: 'ENDED' });
    setTimeout(() => get().resetCallState(), 1200);
  },

  // ── End Active Call ────────────────────────────────────────────────────────
  endCall: (socketEmit) => {
    const session = get().session;
    if (session) {
      api.calls.end(session.roomName).catch(() => {});
      if (socketEmit && session.targetId) {
        socketEmit('call:hangup', {
          roomId: session.roomName,
          targetId: session.targetId,
        });
      }
    }
    set({ status: 'ENDED', isScreenSharing: false, isWhiteboardOpen: false });
    setTimeout(() => get().resetCallState(), 1200);
  },

  // ── Modifiers ──────────────────────────────────────────────────────────────
  setViewMode: (viewMode) => set({ viewMode }),
  setStatus: (status) => set({ status }),
  setSession: (session) => set({ session }),
  setError: (errorMessage) => set({ errorMessage }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleVideo: () => set((s) => ({ isVideoOff: !s.isVideoOff })),
  toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),
  toggleWhiteboard: () => set((s) => ({ isWhiteboardOpen: !s.isWhiteboardOpen })),

  setActiveSpeaker: (activeSpeakerId) => set({ activeSpeakerId }),
  setNetworkQuality: (networkQuality) => set({ networkQuality }),
  tickDuration: () => set((s) => ({ callDurationSeconds: s.callDurationSeconds + 1 })),

  setDevices: (availableDevices) => set({ availableDevices }),
  setAudioInput: (selectedAudioInput) => set({ selectedAudioInput }),
  setAudioOutput: (selectedAudioOutput) => set({ selectedAudioOutput }),
  setVideoInput: (selectedVideoInput) => set({ selectedVideoInput }),

  resetCallState: () =>
    set({
      status: 'IDLE',
      viewMode: 'modal',
      session: null,
      incomingInvite: null,
      errorMessage: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isWhiteboardOpen: false,
      activeSpeakerId: null,
      networkQuality: 'good',
      callDurationSeconds: 0,
    }),
}));
