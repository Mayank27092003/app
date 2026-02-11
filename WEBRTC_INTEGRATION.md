# WebRTC Calling Integration

This document describes the WebRTC calling features integrated into the LoadRider backend application. The calling system is tightly integrated with the existing conversation system, ensuring that calls can only be made between users who are participants in the same conversation.

## 🏗️ Architecture Overview

### Key Components

1. **Database Models**
   - `CallSession`: Stores call session information
   - `CallParticipant`: Tracks participants in each call

2. **Services**
   - `WebRTCService`: Handles call logic and signaling
   - Socket handlers for real-time communication

3. **Controllers & Routes**
   - RESTful API endpoints for call management
   - Socket events for real-time signaling

4. **Integration Points**
   - Conversation system integration
   - Message system for call notifications
   - Socket service for real-time events

## 📋 Features

### Core Calling Features

- **Audio & Video Calls**: Support for both audio and video calling
- **Conversation-Based**: Calls restricted to users in existing conversations
- **Real-time Signaling**: WebRTC offer/answer/ICE candidate exchange
- **Call Management**: Accept, decline, end calls
- **Call History**: Track and retrieve call history per conversation
- **Message Integration**: Call events automatically create conversation messages

### Security & Validation

- **Authentication Required**: All call endpoints require valid authentication
- **Conversation Validation**: Users must be participants in the conversation
- **Online Status Check**: Calls only initiated to online users
- **Active Call Prevention**: Prevents multiple active calls in same conversation

## 🗄️ Database Schema

### Call Sessions Table

```sql
CREATE TABLE call_sessions (
  id SERIAL PRIMARY KEY,
  callerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiverId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  callType VARCHAR(10) NOT NULL CHECK (callType IN ('audio', 'video')),
  status VARCHAR(20) NOT NULL DEFAULT 'initiating' CHECK (status IN (
    'initiating', 'ringing', 'connected', 'ended', 'declined', 'missed', 'busy'
  )),
  startTime TIMESTAMP NULL,
  endTime TIMESTAMP NULL,
  duration INTEGER NULL, -- in seconds
  callQuality VARCHAR(20) NULL CHECK (callQuality IN ('excellent', 'good', 'fair', 'poor')),
  networkType VARCHAR(20) NULL CHECK (networkType IN ('wifi', 'cellular', 'ethernet', 'unknown')),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Call Participants Table

```sql
CREATE TABLE call_participants (
  id SERIAL PRIMARY KEY,
  callSessionId INTEGER NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joinedAt TIMESTAMP NULL,
  leftAt TIMESTAMP NULL,
  isMuted BOOLEAN NOT NULL DEFAULT FALSE,
  isVideoEnabled BOOLEAN NOT NULL DEFAULT TRUE,
  isScreenSharing BOOLEAN NOT NULL DEFAULT FALSE,
  connectionQuality VARCHAR(20) NULL CHECK (connectionQuality IN ('excellent', 'good', 'fair', 'poor')),
  networkType VARCHAR(20) NULL CHECK (networkType IN ('wifi', 'cellular', 'ethernet', 'unknown')),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(callSessionId, userId)
);
```

## 🚀 API Endpoints

### Call Management

#### Initiate Call
```http
POST /api/v1/webrtc/calls/initiate
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversationId": 123,
  "receiverId": 456,
  "callType": "video"
}
```

#### Accept Call
```http
POST /api/v1/webrtc/calls/{callSessionId}/accept
Authorization: Bearer <token>
```

#### Decline Call
```http
POST /api/v1/webrtc/calls/{callSessionId}/decline
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Busy right now"
}
```

#### End Call
```http
POST /api/v1/webrtc/calls/{callSessionId}/end
Authorization: Bearer <token>
```

#### WebRTC Signaling
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
  "toUserId": 456
}
```

#### Get Call History
```http
GET /api/v1/webrtc/calls/history/{conversationId}?page=1&limit=20
Authorization: Bearer <token>
```

## 🔌 Socket Events

### Client → Server Events

- `call_incoming`: Handle incoming call notification
- `call_accepted`: Handle call acceptance
- `call_declined`: Handle call decline
- `call_ended`: Handle call end
- `webrtc_signaling`: Handle WebRTC signaling data
- `call_status_update`: Handle call status updates

### Server → Client Events

- `call_incoming`: Incoming call notification
- `call_accepted`: Call accepted notification
- `call_declined`: Call declined notification
- `call_ended`: Call ended notification
- `webrtc_signaling`: WebRTC signaling data
- `call_status_update`: Call status updates

## 💬 Message Integration

The system automatically creates conversation messages for call events:

- **Call Initiated**: "📞 Video call started"
- **Call Accepted**: "✅ Call accepted"
- **Call Declined**: "❌ Call declined: [reason]"
- **Call Ended**: "📞 Call ended (2m 30s)"

## 🔄 Call Flow

### 1. Call Initiation
1. User initiates call via API
2. System validates conversation participation
3. System checks receiver is online
4. System prevents duplicate active calls
5. Call session created in database
6. Caller added as participant
7. System message inserted in conversation
8. Incoming call event sent to receiver

### 2. Call Acceptance
1. Receiver accepts call via API
2. Call status updated to "connected"
3. Start time recorded
4. Receiver added as participant
4. System message inserted
5. Call accepted event sent to caller

### 3. WebRTC Signaling
1. Participants exchange offer/answer/ICE candidates
2. Signaling data sent via socket events
3. Direct peer-to-peer connection established

### 4. Call Termination
1. Either participant ends call
2. Call status updated to "ended"
3. End time and duration recorded
4. Participant left time recorded
5. System message inserted
6. Call ended event sent to all participants

## 🛡️ Security Considerations

### Authentication & Authorization
- All endpoints require valid JWT authentication
- Users can only initiate calls in conversations they participate in
- Users can only accept/decline calls intended for them
- Users can only end calls they participate in

### Validation
- Conversation existence validation
- Participant validation
- Online status validation
- Active call prevention
- Call type validation (audio/video)

### Data Protection
- Call signaling data encrypted in transit
- Call history access restricted to conversation participants
- Sensitive call data not logged

## 📊 Monitoring & Analytics

### Call Metrics
- Call duration tracking
- Call quality metrics
- Network type tracking
- Connection quality monitoring
- Call success/failure rates

### Logging
- Call initiation/acceptance/decline/end events
- WebRTC signaling events
- Error logging for debugging
- Performance metrics

## 🚀 Frontend Integration

### Required Frontend Components

1. **Call UI Components**
   - Incoming call notification
   - Call controls (mute, video toggle, end)
   - Call status indicators

2. **WebRTC Implementation**
   - RTCPeerConnection setup
   - Media stream handling
   - Signaling data exchange

3. **Socket Integration**
   - Listen for call events
   - Send signaling data
   - Handle call state changes

### Example Frontend Flow

```javascript
// Listen for incoming calls
socket.on('call_incoming', (data) => {
  showIncomingCallModal(data);
});

// Handle WebRTC signaling
socket.on('webrtc_signaling', (data) => {
  handleSignalingData(data);
});

// Send signaling data
function sendSignalingData(callSessionId, type, data, toUserId) {
  socket.emit('webrtc_signaling', {
    callSessionId,
    type,
    data,
    toUserId
  });
}
```

## 🔧 Configuration

### Environment Variables
- `FRONTEND_URL`: Frontend URL for CORS configuration
- Database connection settings
- JWT secret for authentication

### Socket Configuration
- CORS settings for WebRTC
- Connection limits
- Event rate limiting

## 📈 Performance Considerations

### Database Optimization
- Indexed foreign keys for fast lookups
- Pagination for call history
- Efficient query patterns

### Socket Performance
- Event batching for high-frequency signaling
- Connection pooling
- Memory management for active calls

### WebRTC Optimization
- ICE server configuration
- Bandwidth adaptation
- Quality monitoring

## 🧪 Testing

### Unit Tests
- Service layer testing
- Controller testing
- Model validation testing

### Integration Tests
- API endpoint testing
- Socket event testing
- Database transaction testing

### End-to-End Tests
- Complete call flow testing
- Multi-user scenarios
- Error handling testing

## 📚 Documentation

### API Documentation
- Swagger/OpenAPI documentation
- Request/response examples
- Error code documentation

### Developer Guide
- Integration examples
- Best practices
- Troubleshooting guide

## 🔄 Future Enhancements

### Planned Features
- Group calling support
- Screen sharing
- Call recording
- Advanced call controls
- Call quality analytics
- Push notifications for missed calls

### Scalability Improvements
- Redis for call state management
- Load balancing for signaling
- CDN for media streaming
- Microservices architecture

---

This WebRTC integration provides a robust foundation for real-time calling features while maintaining security, performance, and integration with the existing conversation system.
