# WebRTC Real-Time Audio/Video Calling System

## 🎯 Overview

ProjectHive এখন সম্পূর্ণ **WebRTC-based real-time audio and video calling** support করে! এই implementation আপনাকে সরাসরি microphone এবং camera ব্যবহার করে কথা বলতে এবং video call করতে দেয়।

## ✨ Features

### ✅ Implemented Features

1. **Real Audio/Video Calling**
   - ✅ Peer-to-peer WebRTC connections
   - ✅ Microphone access and audio streaming
   - ✅ Camera access and video streaming
   - ✅ NAT traversal using Google STUN servers

2. **Call Controls**
   - ✅ Mute/unmute microphone
   - ✅ Enable/disable camera
   - ✅ Hang up / end call
   - ✅ Accept/decline incoming calls

3. **User Interface**
   - ✅ Incoming call modal with ringtone
   - ✅ Calling modal (waiting for answer)
   - ✅ In-call UI with video preview
   - ✅ Picture-in-picture local video
   - ✅ Call duration timer
   - ✅ Modern, responsive UI design

4. **Call Types**
   - ✅ Audio-only calls (voice call)
   - ✅ Video calls with camera
   - ✅ Easy switching between call types

## 🏗️ Architecture

### Components

1. **Call Manager** (`/assets/js/core/call-manager.js`)
   - WebRTC connection management
   - Media stream handling (audio/video)
   - ICE candidate exchange
   - Call state management

2. **Server Signaling** (`server/services/socket.service.js`)
   - Call initiation/acceptance
   - WebRTC signaling relay
   - Friend verification before calls

3. **UI Modals** (messages.html)
   - Incoming call notification
   - Calling/ringing screen
   - Active call interface

### Call Flow

```
CALLER                    SERVER                   RECEIVER
  |                         |                          |
  |--[call:initiate]------->|                          |
  |                         |-----[call:incoming]----->|
  |                         |                          |
  |                         |<----[call:accept]--------|
  |<---[call:accepted]------|                          |
  |                         |                          |
  |--[WebRTC offer]-------->|-----[WebRTC offer]------>|
  |                         |                          |
  |<---[WebRTC answer]------|<----[WebRTC answer]------|
  |                         |                          |
  |<====== Direct P2P Audio/Video Connection ========>|
```

## 🎮 How to Use

### Starting a Call

#### Video Call:
1. Open a direct message conversation
2. Click the **Video Call** button (📹) in the chat header
3. Browser will ask for camera/microphone permission - **allow it**
4. Wait for the other person to accept
5. Start talking!

#### Audio Call:
1. Open a direct message conversation
2. Click the **Audio Call** button (📞) in the chat header
3. Browser will ask for microphone permission - **allow it**
4. Wait for the other person to accept
5. Start talking!

### Receiving a Call

1. When someone calls you, a modal will pop up
2. You'll see the caller's name and hear a ringtone
3. Click **Accept** to answer or **Decline** to reject
4. Browser will ask for permissions - allow them
5. You're now connected!

### During a Call

#### Controls:
- **Mute/Unmute** 🎤 - Toggle your microphone
- **Video On/Off** 📹 - Toggle your camera
- **End Call** ❌ - Hang up the call

#### What You See:
- Large view: Remote person's video
- Small view (top-right): Your own video (picture-in-picture)
- Bottom controls: Mute, video, hang up buttons
- Top center: Call duration timer

## 🔧 Technical Details

### WebRTC Configuration

```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
]
```

### Media Constraints

**Audio:**
```javascript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
```

**Video:**
```javascript
video: {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'user'
}
```

## 🛡️ Security Features

1. **Friend Verification**: Server verifies friendship before allowing calls
2. **Permission-Based**: Browser asks for explicit microphone/camera access
3. **End-to-End**: WebRTC creates direct peer-to-peer connections
4. **Encrypted**: WebRTC uses DTLS-SRTP encryption by default

## 🐛 Troubleshooting

### Call Won't Connect?

**Problem**: "Failed to start call" error
**Solution**:
- Check browser microphone/camera permissions
- Go to browser settings → Privacy → Camera/Microphone
- Allow access for your site

**Problem**: "Call connection failed"
**Solution**:
- Check your internet connection
- Try refreshing the page
- Make sure both users are online

### No Audio/Video?

**Problem**: Can't hear the other person
**Solution**:
- Check if you've muted them accidentally
- Check your speaker/headphone volume
- Make sure remote video element is not muted

**Problem**: Other person can't hear you
**Solution**:
- Check if you're muted (microphone icon)
- Click unmute button
- Check browser microphone permissions

### Camera Not Working?

**Problem**: Black screen or no video
**Solution**:
- Make sure camera is not being used by another app
- Check browser camera permissions
- Try toggling video off and on again
- Check if camera is physically covered

## 📱 Browser Compatibility

### Fully Supported:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Safari 14+ (macOS/iOS)
- ✅ Opera 67+

### Features by Browser:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Audio Call | ✅ | ✅ | ✅ | ✅ |
| Video Call | ✅ | ✅ | ✅ | ✅ |
| Screen Share | ✅ | ✅ | ✅ | ✅ |
| Mobile Support | ✅ | ✅ | ⚠️ | ✅ |

⚠️ = Limited or requires specific conditions

## 🔮 Future Enhancements

### Planned Features:
- [ ] Screen sharing during calls
- [ ] Group video calls (3+ people)
- [ ] Call recording
- [ ] Background blur/virtual backgrounds
- [ ] Call quality indicators
- [ ] Network statistics display
- [ ] Call history logging
- [ ] Picture-in-picture mode for multitasking

## 📝 Code Examples

### Initiating a Call

```javascript
// Video call
await window.callManager.initiateCall(targetUser, true);

// Audio call
await window.callManager.initiateCall(targetUser, false);
```

### Accepting a Call

```javascript
await window.callManager.acceptCall();
```

### Ending a Call

```javascript
window.callManager.endCall();
```

### Toggle Controls

```javascript
// Mute/unmute
window.callManager.toggleMute();

// Video on/off
window.callManager.toggleVideo();
```

## 🎨 UI Customization

Call modals use Tailwind CSS and can be customized by editing:
- `public/pages/user/messages.html` (modals section)
- Tailwind classes for colors, sizes, animations
- Material Symbols icons for call buttons

## 📊 Performance Considerations

### Bandwidth Requirements:
- **Audio-only**: ~40-50 Kbps
- **Video (720p)**: ~1-2 Mbps
- **Video (1080p)**: ~2-4 Mbps

### Recommended:
- Minimum: 1 Mbps upload/download
- Optimal: 3+ Mbps upload/download
- Low latency network (< 100ms ping)

## 🎓 Learning Resources

- [WebRTC Official Docs](https://webrtc.org/)
- [MDN WebRTC API Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Google STUN/TURN Servers](https://cloud.google.com/nat/docs/gce-example)

---

**Built with ❤️ for ProjectHive**

আপনি এখন real audio এবং video call করতে পারবেন! 🎉
