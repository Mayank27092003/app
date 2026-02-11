# WebRTC Signaling Implementation Guide

## 🎯 Overview

Your WebRTC implementation supports **TWO methods** for signaling exchange. Understanding when to use each is critical for proper audio/video functionality.

## 📡 Method 1: REST API (Recommended for Initial Implementation)

### Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/signaling
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "offer|answer|ice-candidate",
  "data": { /* SDP or ICE candidate data */ },
  "toUserId": 456
}
```

### Advantages
- ✅ Simpler to implement
- ✅ Works with existing HTTP client
- ✅ Automatic authentication via token
- ✅ Validation and error handling

### Frontend Example
```javascript
async function sendSignalingViaAPI(callSessionId, type, data, toUserId) {
  try {
    const response = await fetch(`/api/v1/webrtc/calls/${callSessionId}/signaling`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, data, toUserId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send signaling data');
    }
  } catch (error) {
    console.error('Signaling error:', error);
  }
}

// Usage
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
await sendSignalingViaAPI(callSessionId, 'offer', offer, receiverId);
```

## 📡 Method 2: Socket.IO (For Real-time Performance)

### Socket Event
```javascript
socket.emit('webrtc_signaling', {
  callSessionId: 123,
  type: 'offer|answer|ice-candidate',
  data: { /* SDP or ICE candidate data */ },
  toUserId: 456
});
```

### Advantages
- ✅ Lower latency
- ✅ Better for rapid ICE candidate exchange
- ✅ Real-time bidirectional communication

### Frontend Example
```javascript
function sendSignalingViaSocket(callSessionId, type, data, toUserId) {
  socket.emit('webrtc_signaling', {
    callSessionId,
    type,
    data,
    toUserId
  });
}

// Usage
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
sendSignalingViaSocket(callSessionId, 'offer', offer, receiverId);
```

## 🎯 Recommended Approach: Hybrid

### Use REST API for:
- ✅ Initial offer/answer exchange (slower, less time-sensitive)
- ✅ Cases where you need guaranteed delivery confirmation
- ✅ When socket connection is unstable

### Use Socket.IO for:
- ✅ ICE candidate exchange (frequent, time-sensitive)
- ✅ When socket connection is stable
- ✅ For real-time low-latency requirements

### Hybrid Example
```javascript
class WebRTCSignaling {
  constructor(socket, token, apiUrl) {
    this.socket = socket;
    this.token = token;
    this.apiUrl = apiUrl;
  }

  // Use REST API for offer/answer
  async sendOfferOrAnswer(callSessionId, type, data, toUserId) {
    const response = await fetch(
      `${this.apiUrl}/webrtc/calls/${callSessionId}/signaling`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data, toUserId })
      }
    );
    return response.json();
  }

  // Use Socket for ICE candidates (lower latency)
  sendIceCandidate(callSessionId, candidate, toUserId) {
    this.socket.emit('webrtc_signaling', {
      callSessionId,
      type: 'ice-candidate',
      data: candidate,
      toUserId
    });
  }
}

// Usage
const signaling = new WebRTCSignaling(socket, token, API_URL);

// Send offer via REST API
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
await signaling.sendOfferOrAnswer(callSessionId, 'offer', offer, receiverId);

// Send ICE candidates via Socket
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signaling.sendIceCandidate(callSessionId, event.candidate, receiverId);
  }
};
```

## 📥 Receiving Signaling Data

**IMPORTANT:** Regardless of which method you use to **send**, you **MUST** listen for signaling data on the socket:

```javascript
socket.on('webrtc_signaling', async (data) => {
  const { callSessionId, type, data: signalingData, fromUserId } = data;
  
  console.log(`Received ${type} from user ${fromUserId}`);
  
  try {
    if (type === 'offer') {
      // Received an offer, create answer
      await peerConnection.setRemoteDescription(signalingData);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer back (via API or socket)
      await sendSignaling(callSessionId, 'answer', answer, fromUserId);
    }
    else if (type === 'answer') {
      // Received an answer
      await peerConnection.setRemoteDescription(signalingData);
    }
    else if (type === 'ice-candidate') {
      // Received ICE candidate
      await peerConnection.addIceCandidate(signalingData);
    }
  } catch (error) {
    console.error('Error handling signaling:', error);
  }
});
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: Not Listening on Socket
```javascript
// WRONG: Using REST API to send but not listening on socket
await sendSignalingViaAPI(callSessionId, 'offer', offer, receiverId);
// Missing: socket.on('webrtc_signaling', ...) ❌
```

### ❌ Mistake 2: Sending to Wrong User
```javascript
// WRONG: Sending signaling to yourself
socket.emit('webrtc_signaling', {
  toUserId: myUserId  // ❌ Should be the OTHER user's ID
});

// CORRECT: Send to the other participant
socket.emit('webrtc_signaling', {
  toUserId: otherUserId  // ✅
});
```

### ❌ Mistake 3: Not Handling All Signaling Types
```javascript
// WRONG: Only handling offer/answer
socket.on('webrtc_signaling', async (data) => {
  if (data.type === 'offer') { /* ... */ }
  else if (data.type === 'answer') { /* ... */ }
  // Missing: ice-candidate handling ❌
});

// CORRECT: Handle all types
socket.on('webrtc_signaling', async (data) => {
  if (data.type === 'offer') { /* ... */ }
  else if (data.type === 'answer') { /* ... */ }
  else if (data.type === 'ice-candidate') { /* ... */ }  // ✅
});
```

## 🔍 Debugging Signaling Issues

### Backend Logs to Check
```
✅ "WebRTC signaling: offer from user 1 to user 2 for call 123"
✅ "WebRTC signaling: answer from user 2 to user 1 for call 123"
✅ "WebRTC signaling: ice-candidate from user 1 to user 2 for call 123"
```

### Frontend Console Logs
```javascript
// Add comprehensive logging
socket.on('webrtc_signaling', (data) => {
  console.log('📨 Received signaling:', {
    type: data.type,
    from: data.fromUserId,
    callId: data.callSessionId,
    timestamp: data.timestamp
  });
  // Handle signaling...
});

// Log outgoing signaling
function sendSignaling(callSessionId, type, data, toUserId) {
  console.log('📤 Sending signaling:', {
    type,
    to: toUserId,
    callId: callSessionId
  });
  socket.emit('webrtc_signaling', { callSessionId, type, data, toUserId });
}
```

### Network Tab
In browser DevTools → Network → WS (WebSocket):
```
✅ Should see: webrtc_signaling events being sent
✅ Should see: webrtc_signaling events being received
✅ Check payload data matches expected format
```

## 🎬 Complete Working Example

```javascript
class WebRTCCall {
  constructor(callSessionId, localUserId, remoteUserId, socket, token) {
    this.callSessionId = callSessionId;
    this.localUserId = localUserId;
    this.remoteUserId = remoteUserId;
    this.socket = socket;
    this.token = token;
    this.peerConnection = null;
    
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('webrtc_signaling', async (data) => {
      if (data.callSessionId !== this.callSessionId) return;
      
      await this.handleSignaling(data);
    });
  }

  async initCall() {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    
    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Add local tracks
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
    
    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      document.getElementById('remoteAudio').srcObject = remoteStream;
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling('ice-candidate', event.candidate);
      }
    };
    
    // Create and send offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    await this.sendSignaling('offer', offer);
  }

  async handleSignaling(data) {
    const { type, data: signalingData, fromUserId } = data;
    
    if (fromUserId !== this.remoteUserId) {
      console.warn('Received signaling from unexpected user');
      return;
    }
    
    try {
      if (type === 'offer') {
        await this.peerConnection.setRemoteDescription(signalingData);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await this.sendSignaling('answer', answer);
      }
      else if (type === 'answer') {
        await this.peerConnection.setRemoteDescription(signalingData);
      }
      else if (type === 'ice-candidate') {
        await this.peerConnection.addIceCandidate(signalingData);
      }
    } catch (error) {
      console.error('Error handling signaling:', error);
    }
  }

  async sendSignaling(type, data) {
    // Use socket for real-time signaling
    this.socket.emit('webrtc_signaling', {
      callSessionId: this.callSessionId,
      type,
      data,
      toUserId: this.remoteUserId
    });
    
    // Alternative: Use REST API
    // await fetch(`/api/v1/webrtc/calls/${this.callSessionId}/signaling`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ type, data, toUserId: this.remoteUserId })
    // });
  }

  endCall() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}

// Usage
const call = new WebRTCCall(
  callSessionId,
  myUserId,
  otherUserId,
  socket,
  authToken
);

await call.initCall();
```

## ✅ Quick Checklist

Before starting a call, ensure:

- [ ] Socket is connected: `socket.connected === true`
- [ ] Listening for signaling: `socket.on('webrtc_signaling', ...)`
- [ ] Have callSessionId from initiate call response
- [ ] Have remote user ID
- [ ] Microphone permission granted
- [ ] Using HTTPS or localhost
- [ ] Peer connection configured with STUN servers
- [ ] Local media stream obtained
- [ ] Tracks added to peer connection
- [ ] ICE candidate handler set up
- [ ] Remote track handler set up

## 🆘 Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| No signaling received | Not listening on socket | Add `socket.on('webrtc_signaling')` |
| Offer not received | Wrong toUserId | Verify sending to correct user |
| ICE candidates not working | Not handling ice-candidate type | Add handler for 'ice-candidate' |
| Connection state stuck | Firewall/NAT issues | Add TURN server |
| Audio not playing | Audio element muted | Check `autoplay` and `muted` attributes |

---

**Last Updated:** December 2024
**Status:** ✅ Production Ready
