/**
 * ProjectHive WebRTC Call Manager
 * Handles real-time audio/video calling with proper microphone/speaker access
 */

class CallManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.currentCall = null;
    this.socket = null;
    this.isAudioOnly = false;

    // ICE servers for NAT traversal (Google STUN servers)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
  }

  /**
   * Initialize socket connection for call signaling
   */
  setSocket(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
   * Setup WebRTC signaling listeners
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Incoming call notification
    this.socket.on('call:incoming', (data) => {
      console.log('[Call] Incoming call:', data);
      this.showIncomingCallModal(data);
    });

    // Call accepted by remote user
    this.socket.on('call:accepted', async (data) => {
      console.log('[Call] Call accepted:', data);
      if (this.currentCall && this.currentCall.roomId === data.roomId) {
        await this.createPeerConnection();
        await this.createOffer();
      }
    });

    // Call declined by remote user
    this.socket.on('call:declined', (data) => {
      console.log('[Call] Call declined:', data);
      this.endCall();
      PHToast.show('Call declined', 'info');
    });

    // Remote user hung up
    this.socket.on('call:hungup', (data) => {
      console.log('[Call] Remote user hung up:', data);
      this.endCall();
      PHToast.show('Call ended', 'info');
    });

    // WebRTC signaling messages (offer/answer/ICE candidates)
    this.socket.on('webrtc:signal', async (data) => {
      console.log('[Call] WebRTC signal received:', data.signal.type);
      await this.handleSignal(data);
    });
  }

  /**
   * Initiate a call to a user
   */
  async initiateCall(targetUser, isVideoCall = false) {
    try {
      this.isAudioOnly = !isVideoCall;

      // Check microphone/camera permissions
      const hasPermission = await this.checkMediaPermissions(isVideoCall);
      if (!hasPermission) {
        PHToast.show('Microphone/camera access denied', 'error');
        return;
      }

      // Get local media stream
      await this.getLocalStream(isVideoCall);

      const roomId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.currentCall = {
        roomId,
        targetId: targetUser.id,
        targetName: targetUser.name || `${targetUser.first_name} ${targetUser.last_name}`,
        isInitiator: true,
        isVideoCall
      };

      // Show calling UI
      this.showCallingModal();

      // Emit call initiate event to server
      this.socket.emit('call:initiate', {
        roomId,
        targetId: targetUser.id,
        callerName: window.currentUser?.first_name || 'User',
        isWebRTC: true,
        isVoiceOnly: !isVideoCall
      });

      console.log('[Call] Call initiated:', this.currentCall);
    } catch (err) {
      console.error('[Call] Error initiating call:', err);
      PHToast.show('Failed to start call: ' + err.message, 'error');
      this.endCall();
    }
  }

  /**
   * Accept an incoming call
   */
  async acceptCall() {
    try {
      const isVideoCall = this.currentCall?.isVideoCall || false;

      // Get local media stream
      await this.getLocalStream(isVideoCall);

      // Hide incoming modal, show in-call UI
      this.hideIncomingCallModal();
      this.showInCallUI();

      // Notify caller that call is accepted
      this.socket.emit('call:accept', {
        roomId: this.currentCall.roomId,
        targetId: this.currentCall.callerId
      });

      // Create peer connection and wait for offer
      await this.createPeerConnection();

      console.log('[Call] Call accepted, waiting for offer...');
    } catch (err) {
      console.error('[Call] Error accepting call:', err);
      PHToast.show('Failed to accept call: ' + err.message, 'error');
      this.declineCall();
    }
  }

  /**
   * Decline an incoming call
   */
  declineCall() {
    if (!this.currentCall) return;

    this.socket.emit('call:decline', {
      roomId: this.currentCall.roomId,
      targetId: this.currentCall.callerId
    });

    this.hideIncomingCallModal();
    this.currentCall = null;

    console.log('[Call] Call declined');
  }

  /**
   * Hang up / end call
   */
  endCall() {
    if (this.currentCall) {
      this.socket.emit('call:hangup', {
        roomId: this.currentCall.roomId,
        targetId: this.currentCall.targetId || this.currentCall.callerId
      });
    }

    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Hide all call UIs
    this.hideIncomingCallModal();
    this.hideCallingModal();
    this.hideInCallUI();

    this.currentCall = null;
    this.remoteStream = null;

    console.log('[Call] Call ended');
  }

  /**
   * Check if browser supports media devices
   */
  async checkMediaPermissions(needsVideo = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      PHToast.show('Your browser does not support audio/video calls', 'error');
      return false;
    }

    try {
      // Request permissions
      const constraints = {
        audio: true,
        video: needsVideo
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('[Call] Permission denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        PHToast.show('Please allow microphone/camera access in browser settings', 'error');
      } else {
        PHToast.show('Could not access microphone/camera: ' + err.message, 'error');
      }
      return false;
    }
  }

  /**
   * Get local audio/video stream
   */
  async getLocalStream(includeVideo = false) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: includeVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Show local video/audio preview
      const localVideo = document.getElementById('local-video');
      if (localVideo && this.localStream) {
        localVideo.srcObject = this.localStream;
      }

      console.log('[Call] Local stream obtained:', this.localStream.getTracks());
      return this.localStream;
    } catch (err) {
      console.error('[Call] Error getting local stream:', err);
      throw err;
    }
  }

  /**
   * Create WebRTC peer connection
   */
  async createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(this.iceServers);

      // Add local stream tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
          console.log('[Call] Added local track:', track.kind);
        });
      }

      // Handle incoming remote tracks
      this.peerConnection.ontrack = (event) => {
        console.log('[Call] Remote track received:', event.track.kind);
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            remoteVideo.srcObject = this.remoteStream;
          }
          this.remoteStream.addTrack(event.track);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[Call] Sending ICE candidate');
          this.socket.emit('webrtc:signal', {
            targetId: this.currentCall.isInitiator ? this.currentCall.targetId : this.currentCall.callerId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      // Connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('[Call] Connection state:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'connected') {
          PHToast.show('Call connected', 'success');
        } else if (this.peerConnection.connectionState === 'failed' ||
                   this.peerConnection.connectionState === 'disconnected') {
          PHToast.show('Call connection lost', 'error');
          this.endCall();
        }
      };

      console.log('[Call] Peer connection created');
    } catch (err) {
      console.error('[Call] Error creating peer connection:', err);
      throw err;
    }
  }

  /**
   * Create and send offer (caller side)
   */
  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: !this.isAudioOnly
      });

      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('webrtc:signal', {
        targetId: this.currentCall.targetId,
        signal: { type: 'offer', offer: offer }
      });

      console.log('[Call] Offer sent');
    } catch (err) {
      console.error('[Call] Error creating offer:', err);
      throw err;
    }
  }

  /**
   * Handle WebRTC signaling messages
   */
  async handleSignal(data) {
    try {
      const { signal } = data;

      if (signal.type === 'offer') {
        // Receiver: got offer from caller
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer));

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit('webrtc:signal', {
          targetId: this.currentCall.callerId,
          signal: { type: 'answer', answer: answer }
        });

        console.log('[Call] Answer sent');
      }
      else if (signal.type === 'answer') {
        // Caller: got answer from receiver
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
        console.log('[Call] Answer received');

        // Show in-call UI now that connection is establishing
        this.hideCallingModal();
        this.showInCallUI();
      }
      else if (signal.type === 'candidate') {
        // ICE candidate
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        console.log('[Call] ICE candidate added');
      }
    } catch (err) {
      console.error('[Call] Error handling signal:', err);
    }
  }

  /**
   * Toggle mute/unmute microphone
   */
  toggleMute() {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const muteBtn = document.getElementById('btn-mute');
      const muteIcon = document.getElementById('mute-icon');

      if (muteBtn && muteIcon) {
        if (audioTrack.enabled) {
          muteBtn.classList.remove('bg-rose-500', 'hover:bg-rose-600');
          muteBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
          muteIcon.textContent = 'mic';
        } else {
          muteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
          muteBtn.classList.add('bg-rose-500', 'hover:bg-rose-600');
          muteIcon.textContent = 'mic_off';
        }
      }

      console.log('[Call] Microphone', audioTrack.enabled ? 'unmuted' : 'muted');
    }
  }

  /**
   * Toggle video on/off
   */
  toggleVideo() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const videoBtn = document.getElementById('btn-toggle-video');
      const videoIcon = document.getElementById('video-icon');

      if (videoBtn && videoIcon) {
        if (videoTrack.enabled) {
          videoBtn.classList.remove('bg-rose-500', 'hover:bg-rose-600');
          videoBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
          videoIcon.textContent = 'videocam';
        } else {
          videoBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
          videoBtn.classList.add('bg-rose-500', 'hover:bg-rose-600');
          videoIcon.textContent = 'videocam_off';
        }
      }

      console.log('[Call] Video', videoTrack.enabled ? 'enabled' : 'disabled');
    }
  }

  // ================== UI METHODS ==================

  /**
   * Show incoming call modal
   */
  showIncomingCallModal(data) {
    this.currentCall = {
      roomId: data.roomId,
      callerId: data.callerId,
      callerName: data.callerName,
      isVideoCall: data.isWebRTC && !data.isVoiceOnly,
      isInitiator: false
    };

    const modal = document.getElementById('incoming-call-modal');
    const callerNameEl = document.getElementById('incoming-caller-name');
    const callTypeEl = document.getElementById('incoming-call-type');

    if (callerNameEl) callerNameEl.textContent = data.callerName;
    if (callTypeEl) callTypeEl.textContent = data.isVoiceOnly ? 'Audio Call' : 'Video Call';
    if (modal) modal.classList.remove('hidden');

    // Play ringtone
    this.playRingtone();
  }

  /**
   * Hide incoming call modal
   */
  hideIncomingCallModal() {
    const modal = document.getElementById('incoming-call-modal');
    if (modal) modal.classList.add('hidden');
    this.stopRingtone();
  }

  /**
   * Show calling modal (waiting for answer)
   */
  showCallingModal() {
    const modal = document.getElementById('calling-modal');
    const targetNameEl = document.getElementById('calling-target-name');

    if (targetNameEl && this.currentCall) {
      targetNameEl.textContent = this.currentCall.targetName;
    }
    if (modal) modal.classList.remove('hidden');
  }

  /**
   * Hide calling modal
   */
  hideCallingModal() {
    const modal = document.getElementById('calling-modal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Show in-call UI
   */
  showInCallUI() {
    const modal = document.getElementById('in-call-modal');
    const remoteNameEl = document.getElementById('in-call-remote-name');

    if (remoteNameEl && this.currentCall) {
      remoteNameEl.textContent = this.currentCall.targetName || this.currentCall.callerName;
    }
    if (modal) modal.classList.remove('hidden');

    // Start call timer
    this.startCallTimer();
  }

  /**
   * Hide in-call UI
   */
  hideInCallUI() {
    const modal = document.getElementById('in-call-modal');
    if (modal) modal.classList.add('hidden');
    this.stopCallTimer();
  }

  /**
   * Start call duration timer
   */
  startCallTimer() {
    const timerEl = document.getElementById('call-timer');
    if (!timerEl) return;

    let seconds = 0;
    this.callTimerInterval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }

  /**
   * Stop call duration timer
   */
  stopCallTimer() {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
  }

  /**
   * Play ringtone
   */
  playRingtone() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();

      this.ringtoneInterval = setInterval(() => {
        oscillator.frequency.value = oscillator.frequency.value === 440 ? 550 : 440;
      }, 1000);

      this.ringtoneOscillator = oscillator;
      this.ringtoneContext = audioContext;
    } catch (err) {
      console.error('[Call] Could not play ringtone:', err);
    }
  }

  /**
   * Stop ringtone
   */
  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringtoneOscillator) {
      this.ringtoneOscillator.stop();
      this.ringtoneOscillator = null;
    }
    if (this.ringtoneContext) {
      this.ringtoneContext.close();
      this.ringtoneContext = null;
    }
  }
}

// Global instance
window.callManager = new CallManager();
