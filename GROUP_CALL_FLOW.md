# Group Call Flow Documentation

This document describes the complete group calling flow for the LoadRider backend WebRTC integration. The system supports both 1-on-1 and group calls within existing conversations.

## 🎯 Overview

The group calling system is designed to work seamlessly with the existing conversation system, allowing any participant in a conversation to initiate calls with all other participants. The system automatically determines whether a call should be 1-on-1 or group based on the number of participants.

## 🔄 Complete Call Flow

### 1. Call Initiation

#### API Endpoint
```http
POST /api/v1/webrtc/calls/initiate
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversationId": 123,
  "callType": "video",
  "isGroupCall": true  // Optional, auto-determined if not specified
}
```

#### Flow Steps
1. **Validation**: Verify caller is a participant in the conversation
2. **Participant Retrieval**: Get all active participants in the conversation
3. **Call Type Determination**: 
   - If `isGroupCall` is specified, use that value
   - Otherwise, auto-determine: `participants.length > 2` = group call
4. **Active Call Check**: Ensure no active call exists in the conversation
5. **Call Session Creation**: Create call session with appropriate metadata
6. **Caller Addition**: Add caller as first participant
7. **Message Creation**: Insert call initiation message in conversation
8. **Online Status Check**: Check which participants are online
9. **Event Broadcasting**: Send `call_incoming` events to online participants
10. **Status Update**: Update call status based on online participants

#### Socket Events Emitted
```javascript
// To all online participants except caller
socket.emit('call_incoming', {
  callSessionId: 456,
  conversationId: 123,
  callerId: 789,
  callType: "video",
  isGroupCall: true,
  participantCount: 4,
  timestamp: "2024-12-01T10:00:00Z"
});
```

### 2. Call Acceptance

#### API Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/accept
Authorization: Bearer <token>
```

#### Flow Steps
1. **Validation**: Verify user is a conversation participant
2. **Call State Check**: Ensure call is in acceptable state (ringing/initiating)
3. **Duplicate Check**: Ensure user isn't already in the call
4. **Participant Addition**: Add user as call participant
5. **Status Update**: Update call to "connected" if first acceptance
6. **Message Creation**: Insert call accepted message
7. **Event Broadcasting**: Notify all other participants

#### Socket Events Emitted
```javascript
// To all other participants
socket.emit('call_accepted', {
  callSessionId: 456,
  conversationId: 123,
  acceptedByUserId: 101,
  isGroupCall: true,
  timestamp: "2024-12-01T10:01:00Z"
});
```

### 3. Call Declination

#### API Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/decline
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Busy right now"  // Optional
}
```

#### Flow Steps
1. **Validation**: Verify user is a conversation participant
2. **Message Creation**: Insert call declined message
3. **Call Status Logic**:
   - **Group Calls**: Don't end the call, just notify others
   - **1-on-1 Calls**: End the call immediately
4. **Event Broadcasting**: Notify all other participants

#### Socket Events Emitted
```javascript
// To all other participants
socket.emit('call_declined', {
  callSessionId: 456,
  conversationId: 123,
  declinedByUserId: 102,
  isGroupCall: true,
  reason: "Busy right now",
  timestamp: "2024-12-01T10:02:00Z"
});
```

### 4. Group Call Joining

#### API Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/join
Authorization: Bearer <token>
```

#### Flow Steps
1. **Validation**: Verify call is a group call and in connected state
2. **Participant Check**: Ensure user is conversation participant
3. **Duplicate Check**: Ensure user isn't already in the call
4. **Participant Addition**: Add user as call participant
5. **Message Creation**: Insert call joined message
6. **Event Broadcasting**: Notify all other participants

#### Socket Events Emitted
```javascript
// To all other participants
socket.emit('call_joined', {
  callSessionId: 456,
  conversationId: 123,
  joinedByUserId: 103,
  isGroupCall: true,
  timestamp: "2024-12-01T10:03:00Z"
});
```

### 5. WebRTC Signaling

#### API Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/signaling
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "offer",
  "data": {
    "sdp": "...",
    "type": "offer"
  },
  "toUserId": 104
}
```

#### Flow Steps
1. **Validation**: Verify call session exists and user is participant
2. **Authorization**: Ensure user can send signaling data
3. **Event Broadcasting**: Forward signaling data to target user

#### Socket Events Emitted
```javascript
// To specific user
socket.emit('webrtc_signaling', {
  callSessionId: 456,
  type: "offer",
  data: { sdp: "...", type: "offer" },
  fromUserId: 789,
  timestamp: "2024-12-01T10:04:00Z"
});
```

### 6. Call Termination

#### API Endpoint
```http
POST /api/v1/webrtc/calls/{callSessionId}/end
Authorization: Bearer <token>
```

#### Flow Steps
1. **Validation**: Verify user is a conversation participant
2. **Duration Calculation**: Calculate call duration
3. **Status Update**: Update call to "ended"
4. **Participant Update**: Mark user as left
5. **Message Creation**: Insert call ended message
6. **Event Broadcasting**: Notify all participants

#### Socket Events Emitted
```javascript
// To all participants
socket.emit('call_ended', {
  callSessionId: 456,
  conversationId: 123,
  endedByUserId: 789,
  isGroupCall: true,
  duration: 300, // seconds
  timestamp: "2024-12-01T10:05:00Z"
});
```

## 📱 Frontend Integration

### Required Frontend Components

#### 1. Call Notification Component
```javascript
// Listen for incoming calls
socket.on('call_incoming', (data) => {
  showIncomingCallModal({
    callSessionId: data.callSessionId,
    conversationId: data.conversationId,
    callerId: data.callerId,
    callType: data.callType,
    isGroupCall: data.isGroupCall,
    participantCount: data.participantCount
  });
});
```

#### 2. Call Controls Component
```javascript
// Accept call
async function acceptCall(callSessionId) {
  await fetch(`/api/v1/webrtc/calls/${callSessionId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

// Decline call
async function declineCall(callSessionId, reason) {
  await fetch(`/api/v1/webrtc/calls/${callSessionId}/decline`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
}

// Join group call
async function joinGroupCall(callSessionId) {
  await fetch(`/api/v1/webrtc/calls/${callSessionId}/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

#### 3. WebRTC Implementation
```javascript
// Handle WebRTC signaling
socket.on('webrtc_signaling', (data) => {
  handleSignalingData(data);
});

// Send signaling data
function sendSignalingData(callSessionId, type, data, toUserId) {
  fetch(`/api/v1/webrtc/calls/${callSessionId}/signaling`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      data,
      toUserId
    })
  });
}
```

## 🔧 Database Schema

### Call Sessions Table
```sql
CREATE TABLE call_sessions (
  id SERIAL PRIMARY KEY,
  callerId INTEGER NOT NULL,
  conversationId INTEGER NOT NULL,
  callType VARCHAR(10) NOT NULL,
  isGroupCall BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'initiating',
  startTime TIMESTAMP NULL,
  endTime TIMESTAMP NULL,
  duration INTEGER NULL,
  callQuality VARCHAR(20) NULL,
  networkType VARCHAR(20) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Call Participants Table
```sql
CREATE TABLE call_participants (
  id SERIAL PRIMARY KEY,
  callSessionId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  joinedAt TIMESTAMP NULL,
  leftAt TIMESTAMP NULL,
  isMuted BOOLEAN NOT NULL DEFAULT FALSE,
  isVideoEnabled BOOLEAN NOT NULL DEFAULT TRUE,
  isScreenSharing BOOLEAN NOT NULL DEFAULT FALSE,
  connectionQuality VARCHAR(20) NULL,
  networkType VARCHAR(20) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(callSessionId, userId)
);
```

## 🎯 Key Features

### 1. Automatic Call Type Detection
- **1-on-1**: 2 participants in conversation
- **Group**: 3+ participants in conversation
- **Override**: Explicit `isGroupCall` parameter

### 2. Smart Participant Management
- **Online Status**: Only notify online participants
- **Late Joiners**: Allow joining ongoing group calls
- **Decline Handling**: Different behavior for 1-on-1 vs group calls

### 3. Message Integration
- **Automatic Messages**: All call events create conversation messages
- **Rich Metadata**: Include call type, duration, participant count
- **System Messages**: Clear, user-friendly call event descriptions

### 4. Real-time Events
- **Socket Broadcasting**: Real-time notifications to all participants
- **Event Types**: Comprehensive event system for all call states
- **Error Handling**: Robust error handling and logging

## 🚀 Usage Examples

### Example 1: Initiate Group Call
```javascript
// Frontend: Start a group call
const response = await fetch('/api/v1/webrtc/calls/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversationId: 123,
    callType: 'video',
    isGroupCall: true
  })
});

const { data: callSession } = await response.json();
console.log('Call initiated:', callSession);
```

### Example 2: Handle Incoming Call
```javascript
// Frontend: Listen for incoming calls
socket.on('call_incoming', (data) => {
  if (data.isGroupCall) {
    showGroupCallNotification(data);
  } else {
    showDirectCallNotification(data);
  }
});

function showGroupCallNotification(data) {
  // Show group call UI with participant count
  const notification = `
    📞 Incoming ${data.callType} group call
    ${data.participantCount} participants
    From: User ${data.callerId}
  `;
  showNotification(notification);
}
```

### Example 3: Join Ongoing Group Call
```javascript
// Frontend: Join an ongoing group call
async function joinOngoingCall(callSessionId) {
  try {
    const response = await fetch(`/api/v1/webrtc/calls/${callSessionId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      console.log('Successfully joined group call');
      // Start WebRTC connection
      initializeWebRTCConnection(callSessionId);
    }
  } catch (error) {
    console.error('Failed to join call:', error);
  }
}
```

## 🔒 Security Considerations

### 1. Authorization
- **Conversation Access**: Users can only call in conversations they participate in
- **Call Actions**: Users can only accept/decline calls intended for them
- **Signaling**: Users can only send signaling data for calls they participate in

### 2. Validation
- **Participant Verification**: All actions verify conversation participation
- **Call State Validation**: Actions only allowed in appropriate call states
- **Duplicate Prevention**: Prevent multiple call sessions in same conversation

### 3. Data Protection
- **Signaling Encryption**: WebRTC signaling data encrypted in transit
- **Call History Access**: Restricted to conversation participants
- **Sensitive Data**: Call quality and network data not exposed in logs

## 📊 Monitoring & Analytics

### Call Metrics
- **Duration Tracking**: Automatic call duration calculation
- **Participant Count**: Track number of participants in group calls
- **Quality Metrics**: Connection quality and network type tracking
- **Success Rates**: Call acceptance and completion rates

### Logging
- **Call Events**: All call initiation, acceptance, decline, and end events
- **WebRTC Signaling**: Signaling data exchange events
- **Error Tracking**: Comprehensive error logging for debugging
- **Performance Metrics**: Call setup time and connection quality

---

This group call flow provides a robust, scalable solution for multi-participant calling within the existing conversation system, ensuring seamless integration with the LoadRider platform's communication features.
