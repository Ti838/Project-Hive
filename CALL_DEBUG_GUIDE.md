# Call Notification Debug Guide 🔍

## সমস্যা
Computer-এ call করলে ringing দেখাচ্ছে কিন্তু receiver এর কাছে notification আসছে না।

## সম্ভাব্য কারণ

### 1. **Receiver এর browser এ Call Manager initialize হয়নি**
- Messages page open না থাকলে call-manager.js load হয় না
- Socket connection না থাকলে events receive করতে পারে না

### 2. **Socket Connection সমস্যা**
- Receiver offline থাকলে
- Socket disconnect হয়ে গেলে
- Different session/tab এ থাকলে

### 3. **Friend Verification ব্যর্থ**
- Server এ friendship check করে - যদি friend না হয় call block হয়

## Debug Steps

### Step 1: Console Log Check করুন

**Caller এর console এ দেখুন:**
```
[Call Manager] 📞 Initiating call to: {user object}
[Call Manager] 📡 Emitting call:initiate to server
[Call] ✅ Call initiated successfully
```

**Receiver এর console এ দেখুন:**
```
[Call Manager] Setting up socket listeners...
[Call Manager] ✅ Socket listeners registered
[Call] 🔔 Incoming call received: {call data}
```

### Step 2: Network Tab Check করুন

1. Browser DevTools → Network tab
2. Filter: WS (WebSocket)
3. দেখুন socket.io connection আছে কিনা
4. Messages tab এ `call:incoming` event দেখুন

### Step 3: Socket Connection Verify করুন

**Receiver এর console এ run করুন:**
```javascript
// Check if socket is connected
console.log('Socket connected:', window.socket?.connected);
console.log('Socket ID:', window.socket?.id);
console.log('Call Manager:', window.callManager);
```

## Solutions

### Solution 1: Receiver কে Messages Page এ থাকতে হবে

**বর্তমান limitation:**
- Call notification শুধুমাত্র messages page এ কাজ করে
- কারণ call-manager.js শুধু সেখানে load হয়

**Fix (Future):**
- Global call manager সব pages এ load করতে হবে
- Service Worker দিয়ে background notification

### Solution 2: Test করার সঠিক নিয়ম

#### ✅ সঠিক পদ্ধতি:
1. **Receiver:**
   - Messages page open করুন
   - Browser console open রাখুন
   - Socket connected verify করুন

2. **Caller:**
   - Messages page open করুন
   - Receiver select করুন
   - Call button click করুন

3. **দেখুন:**
   - Receiver এর browser এ incoming call modal আসছে কিনা

#### ❌ ভুল পদ্ধতি:
- Receiver dashboard/feed page এ থাকলে
- Browser close থাকলে
- Internet disconnect থাকলে

### Solution 3: Manual Verification

**Test করুন দুটো browser window এ:**

**Window 1 (Receiver):**
```javascript
// Console এ run করুন
window.socket.on('call:incoming', (data) => {
  console.log('🔔 CALL RECEIVED:', data);
  alert('Incoming call from: ' + data.callerName);
});
```

**Window 2 (Caller):**
```javascript
// Call করুন
window.startCall(); // or window.startVoiceCall();
```

## Quick Fix Checklist

- [ ] **উভয়ে logged in আছেন?**
- [ ] **উভয়ে friends হিসেবে added?**
- [ ] **Receiver messages page এ আছে?**
- [ ] **Socket connected? (check console)**
- [ ] **Call manager loaded? (check console)**
- [ ] **Browser console এ error আছে?**
- [ ] **Network tab এ WebSocket connected?**

## Advanced Debug

### Server-side Log দেখুন

Server console এ এই logs দেখা উচিত:
```
[ProjectHive] 🔌 User connected: <user-id>
[Call] Call initiated by <caller-id> to <receiver-id>
[Call] Emitting call:incoming to <receiver-socket-id>
```

### Database Check করুন

Verify friendship:
```sql
SELECT * FROM friends
WHERE user_id = '<caller-id>'
AND friend_id = '<receiver-id>';
```

## Common Issues & Fixes

### Issue 1: "User is currently offline"
**কারণ:** Receiver এর socket connection নেই
**Fix:** Receiver কে messages page open করতে বলুন

### Issue 2: "You must be friends to call"
**কারণ:** Database এ friendship record নেই
**Fix:** Friend request পাঠান এবং accept করুন

### Issue 3: Modal দেখাচ্ছে না
**কারণ:** Call manager initialize হয়নি
**Fix:** Page refresh করুন hard refresh (Ctrl+Shift+R)

### Issue 4: Permission denied
**কারণ:** Browser microphone/camera access নেই
**Fix:** Browser settings → Allow microphone/camera

## Expected Behavior

### ✅ Normal Flow:
```
1. Caller clicks call button
2. Browser asks for mic/camera permission
3. Caller sees "Calling..." modal
4. Server sends call:incoming to receiver
5. Receiver sees incoming call modal with ringtone
6. Receiver clicks Accept
7. WebRTC connection establishes
8. Both can talk!
```

### ❌ Current Issue:
```
1. Caller clicks call button ✅
2. Browser asks permission ✅
3. Caller sees "Calling..." ✅
4. Server sends call:incoming ❓
5. Receiver sees nothing ❌
```

## Immediate Test

### Open 2 browser windows (side by side):

**Window 1:**
```
1. Login as User A
2. Go to Messages page
3. Open console
4. Type: console.log('Window 1 ready, socket:', window.socket?.connected)
```

**Window 2:**
```
1. Login as User B
2. Go to Messages page
3. Select User A conversation
4. Click audio/video call button
```

**Expected:**
- Window 1 console: `[Call] 🔔 Incoming call received`
- Window 1 UI: Incoming call modal appears

## Next Steps if Still Not Working

1. **Check server logs** - তে call:initiate event আসছে কিনা
2. **Verify socket connection** - উভয় user এর
3. **Test with different browsers** - Chrome, Firefox
4. **Check firewall/antivirus** - WebSocket block করছে কিনা
5. **Try localhost testing** - same computer, 2 windows

---

**Need More Help?**
Check console logs, send screenshots, এবং আমি আরও debug করতে পারব! 🔧
