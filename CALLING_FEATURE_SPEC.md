# Complete Calling Feature Specification 📞

## Requirements (Messenger/WhatsApp Style)

### ✅ Core Features Needed:

#### 1. **Call Initiation**
- [ ] Call button দেখলেই call যাবে
- [ ] Audio call button আলাদা
- [ ] Video call button আলাদা
- [ ] Permission handling smooth

#### 2. **Call Receiving**
- [ ] যেকোনো page থেকে call notification আসবে
- [ ] Browser notification (desktop + mobile)
- [ ] In-app notification modal
- [ ] Ringtone বাজবে
- [ ] Vibration (mobile)

#### 3. **Call States**
- **Outgoing:**
  - Ringing... দেখাবে
  - Cancel button থাকবে
  - Timeout after 30 seconds

- **Incoming:**
  - Caller info দেখাবে
  - Accept/Decline button
  - Ringtone চলবে

- **Active Call:**
  - Video preview (if video call)
  - Mute/Unmute
  - Speaker on/off
  - Camera on/off (video call)
  - End call button
  - Call duration timer
  - Network quality indicator

- **Ending:**
  - Smooth transition
  - Call summary (duration)
  - Return to messages

#### 4. **Real Communication**
- **Audio:**
  - Crystal clear audio
  - Echo cancellation
  - Noise suppression
  - Auto gain control

- **Video:**
  - HD video (720p)
  - Camera switching (mobile)
  - Picture-in-picture
  - Full screen mode

#### 5. **Multi-Device Support**
- **Desktop:**
  - Full screen call interface
  - Keyboard shortcuts
  - System notifications

- **Mobile:**
  - Responsive call UI
  - Touch optimized buttons
  - Native-like experience
  - Background calling

#### 6. **Auto Navigation**
- Call receive করলে auto messages page এ যাবে
- Call এর conversation খুলবে
- Call end হলে conversation এ থাকবে

#### 7. **Notification System**
- Browser notification API
- Toast notification (in-app)
- Badge count
- Sound + Vibration

---

## Implementation Plan

### Phase 1: Fix Current Issues ✅
- [x] Call manager setup
- [x] Socket connection
- [ ] **Call delivery to receiver** ⚠️ (CURRENT ISSUE)
- [ ] Proper event handling

### Phase 2: Complete Call Flow
- [ ] Browser notification API integration
- [ ] Auto-navigate to messages on call receive
- [ ] Proper call state management
- [ ] Timeout handling (30s)

### Phase 3: Real Communication
- [ ] WebRTC connection optimization
- [ ] TURN server for NAT traversal
- [ ] Audio quality improvements
- [ ] Video quality settings

### Phase 4: Mobile Optimization
- [ ] Mobile-responsive call UI
- [ ] Touch gesture support
- [ ] Background call handling
- [ ] Camera switching

### Phase 5: Advanced Features
- [ ] Call history
- [ ] Missed call notifications
- [ ] Call recording (optional)
- [ ] Screen sharing

---

## Architecture

### Global Call Manager (All Pages)
```javascript
// Load on all pages via ph-system.js
window.globalCallManager = new CallManager();

// Listen for calls everywhere
socket.on('call:incoming', (data) => {
  // Show notification
  // Auto-navigate to messages
  // Show call modal
});
```

### Browser Notification
```javascript
// Request permission
Notification.requestPermission();

// Show notification
new Notification('Incoming call', {
  body: 'From: John Doe',
  icon: '/avatar.jpg',
  vibrate: [200, 100, 200],
  tag: 'call-notification'
});
```

### Auto Navigation
```javascript
// When call received
window.location.href = '/pages/user/messages.html?call=' + callId;

// On messages page, auto-open call modal
if (urlParams.has('call')) {
  showIncomingCallModal();
}
```

---

## Technical Stack

### Frontend:
- **WebRTC** - Peer-to-peer communication
- **Socket.io** - Real-time signaling
- **Notification API** - Browser notifications
- **MediaDevices API** - Camera/microphone access

### Backend:
- **Node.js + Socket.io** - WebSocket server
- **STUN Server** - NAT traversal (Google STUN)
- **TURN Server** - Relay fallback (optional)

### Database:
- **Call History** - Supabase table
- **Call Status** - Redis cache (real-time)

---

## User Flows

### Flow 1: Making a Call

```
User A (Desktop)                    Server                      User B (Mobile)
     |                                |                                |
     |--[Click call button]---------->|                                |
     |                                |                                |
     |<--[Get mic permission]---------|                                |
     |                                |                                |
     |--[Emit call:initiate]--------->|                                |
     |                                |                                |
     |                                |----[Emit call:incoming]------->|
     |                                |                                |
     |                                |                    [Browser notification]
     |                                |                    [Ringtone plays]
     |                                |                    [Call modal shows]
     |                                |                                |
     |                                |<---[Emit call:accept]----------|
     |                                |                                |
     |<--[Emit call:accepted]---------|----[Emit call:accepted]------->|
     |                                |                                |
     |<================== WebRTC P2P Connection ======================>|
     |                                |                                |
     |<=========================== TALKING ===========================>|
```

### Flow 2: Receiving a Call While on Feed Page

```
User A (Messages Page)              Server                      User B (Feed Page)
     |                                |                                |
     |--[Call User B]---------------->|                                |
     |                                |                                |
     |                                |----[call:incoming]------------>|
     |                                |                                |
     |                                |         [Global call manager receives]
     |                                |         [Browser notification shows]
     |                                |         [Click notification]
     |                                |         [Auto navigate to messages]
     |                                |         [Call modal appears]
     |                                |                                |
     |                                |<---[Accept call]---------------|
     |                                |                                |
     |<======================== Connected ==========================>|
```

---

## Key Differences from Current Implementation

### Current (Broken):
❌ Call manager only on messages page
❌ No notification if not on messages
❌ No auto-navigation
❌ Call delivery not working
❌ Mobile not optimized

### Target (Messenger/WhatsApp Style):
✅ Global call manager on all pages
✅ Browser notifications everywhere
✅ Auto-navigate to messages on call
✅ Reliable call delivery
✅ Mobile fully responsive
✅ Background call support
✅ Call history & missed calls

---

## Immediate Fixes Needed

### 1. **Make Call Manager Global**
Load call-manager.js in ph-system.css (not just messages page)

### 2. **Add Browser Notifications**
Request permission on first load
Show notification on incoming call

### 3. **Fix Socket Event Delivery**
Ensure socket connection on all pages
Proper event emission/reception

### 4. **Auto Navigation**
Navigate to messages page on call receive
Pass call data via URL parameter

### 5. **Mobile Responsive UI**
Full-screen call modal on mobile
Touch-optimized buttons
Native-like experience

---

## Success Criteria

### ✅ Call Should Work When:
- [ ] Both users on different pages
- [ ] Receiver on mobile, caller on desktop
- [ ] Vice versa
- [ ] Background tab
- [ ] Screen locked (mobile)

### ✅ Call Should Include:
- [ ] Clear audio (no echo)
- [ ] Smooth video (no lag)
- [ ] Quick connection (<5s)
- [ ] Stable connection
- [ ] Graceful error handling

### ✅ UX Should Be:
- [ ] Intuitive (one-click call)
- [ ] Fast (instant notification)
- [ ] Reliable (always works)
- [ ] Professional (looks polished)
- [ ] Mobile-friendly

---

## Next Steps

1. ✅ Create specification document (THIS FILE)
2. ⏳ Fix call delivery issue
3. ⏳ Implement global call manager
4. ⏳ Add browser notifications
5. ⏳ Mobile responsive UI
6. ⏳ Testing & refinement

---

**This is the roadmap to make calling work like Messenger/WhatsApp! 🚀**
