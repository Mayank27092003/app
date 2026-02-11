# Logistics/Tracking System - Simple Socket.io Backend

This document describes a simple and efficient Node.js + Socket.io backend for a logistics/tracking system with room functionality and real-time location updates.

## Features

- **Simple Room Management**: Join/leave multiple rooms with a single event
- **Real-time Location Updates**: Track driver/user locations with transaction support
- **Multi-client Support**: Works with drivers, shippers, brokers in the same room
- **Database Integration**: PostgreSQL storage with atomic upsert (one location per user)
- **Transaction Support**: Database operations are wrapped in transactions for consistency
- **Future-ready**: No user-based validation at DB level for multiple device support

## Socket Events

### 1. Join Room (`join_room`) - Generic

**Frontend emits:**
```javascript
// Join single room
socket.emit('join_room', {
  rooms: 'user_location_123'
});

// Join multiple rooms
socket.emit('join_room', {
  rooms: ['user_location_123', 'user_location_456', 'contract_789']
});
```

### 2. Leave Room (`leave_room`) - Generic

**Frontend emits:**
```javascript
// Leave single room
socket.emit('leave_room', {
  rooms: 'user_location_123'
});

// Leave multiple rooms
socket.emit('leave_room', {
  rooms: ['user_location_123', 'user_location_456']
});
```

### 3. Update Location (`update_location`)

**Frontend emits:**
```javascript
socket.emit('update_location', {
  userId: 123,
  lat: 40.7128,
  lng: -74.0060,
  speed: 65.5,        // km/h (optional)
  heading: 180,       // degrees (optional)
  battery: 85,        // percentage (optional)
  accuracy: 5.2,      // meters (optional)
  provider: 'gps'     // location provider (optional)
});
```

**Backend response:**
```javascript
// Success
{
  success: true,
  location: {
    userId: 123,
    lat: 40.7128,
    lng: -74.0060,
    speed: 65.5,
    heading: 180,
    battery: 85,
    accuracy: 5.2,
    provider: 'gps',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

### 2. Location Update Broadcast (`location_update`)

**Backend broadcasts to user-specific room:**
```javascript
{
  userId: 123,
  location: {
    userId: 123,
    lat: 40.7128,
    lng: -74.0060,
    speed: 65.5,
    heading: 180,
    battery: 85,
    accuracy: 5.2,
    provider: 'gps',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

## Room Management

**Much Simpler Approach:**
- Frontend automatically joins user-specific rooms: `user:123`, `user:456`, etc.
- No need for manual join/leave room events
- Backend emits location updates to `user:${userId}` rooms
- Frontend subscribes to specific user rooms based on who they want to track

## Database Schema

The system uses a `userLocations` table with the following structure:

```sql
CREATE TABLE userLocations (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(10,2),
  heading DECIMAL(10,2),
  speed DECIMAL(10,2),
  provider VARCHAR(255),
  battery INTEGER CHECK (battery >= 0 AND battery <= 100),
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX user_locations_user_created_idx ON userLocations(userId, createdAt);
```

## Transaction Support

The location upsert operation uses database transactions to ensure atomicity:

```typescript
// Location upsert with transaction
return await UserLocation.transaction(async (trx) => {
  // Delete existing location for this user
  await UserLocation.query(trx).where({ userId }).delete();
  
  // Insert new location
  return await UserLocation.query(trx).insertAndFetch({
    userId,
    lat: payload.lat,
    lng: payload.lng,
    // ... other fields
  });
});
```

This ensures that:
- Only one location record exists per user at any time
- Database operations are atomic (all succeed or all fail)
- No race conditions between delete and insert operations
- Future-ready for multiple device support (no DB-level user constraints)

## Usage Examples

### Frontend Implementation (JavaScript/TypeScript)

```javascript
import io from 'socket.io-client';

// Connect to socket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join user location rooms when connected
socket.on('connect', () => {
  // Join rooms for users you want to track
  socket.emit('join_room', { 
    rooms: ['user_location_123', 'user_location_456', 'user_location_789'] 
  });
});

// Listen for location updates
socket.on('location_update', (data) => {
  console.log('Location update received for user:', data.userId);
  console.log('Location:', data.location);
  // Update map, UI, etc.
  updateMapMarker(data.userId, data.location);
});

// Update location (much simpler!)
function updateLocation(locationData) {
  socket.emit('update_location', {
    userId: getCurrentUserId(),
    lat: locationData.latitude,
    lng: locationData.longitude,
    speed: locationData.speed,
    heading: locationData.heading,
    battery: locationData.battery,
    accuracy: locationData.accuracy,
    provider: 'gps'
  });
}

// Handle errors
socket.on('location_error', (error) => {
  console.error('Location error:', error);
});
```

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useLocationTracking = (userIdsToTrack, currentUserId) => {
  const [socket, setSocket] = useState(null);
  const [locations, setLocations] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join user location rooms for tracking
      const rooms = userIdsToTrack.map(userId => `user_location_${userId}`);
      newSocket.emit('join_room', { rooms });
    });

    newSocket.on('location_update', (data) => {
      setLocations(prev => ({
        ...prev,
        [data.userId]: data.location
      }));
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userIdsToTrack]);

  const updateLocation = (locationData) => {
    if (socket && isConnected) {
      socket.emit('update_location', {
        userId: currentUserId,
        ...locationData
      });
    }
  };

  return { socket, locations, isConnected, updateLocation };
};
```

## Backend API Usage

### Using the Socket Service

```typescript
import { SocketService } from './services/socket';

// Get socket service instance
const socketService = new SocketService(httpServer);

// Emit location update to specific room
socketService.emitLocationUpdate('contract_123', {
  userId: 123,
  lat: 40.7128,
  lng: -74.0060,
  speed: 65.5,
  heading: 180,
  battery: 85,
  timestamp: new Date().toISOString()
});

// Emit to multiple rooms
socketService.emitLocationUpdateToRooms(
  ['contract_123', 'driver_456'],
  locationData
);

// Get room information
const memberCount = socketService.getRoomMemberCount('contract_123');
const sockets = socketService.getSocketsInRoom('contract_123');
```

### Using the Location Tracking Service

```typescript
import { LocationTrackingService } from './services/location/tracking.service';

const trackingService = new LocationTrackingService();

// Update location
const location = await trackingService.upsertLocation(userId, {
  lat: 40.7128,
  lng: -74.0060,
  speed: 65.5,
  heading: 180,
  battery: 85,
  accuracy: 5.2,
  provider: 'gps'
});

// Get recent locations
const recentLocations = await trackingService.getRecentLocations(userId, 50);

// Get latest location
const latestLocation = await trackingService.getLatestLocation(userId);

// Get location statistics
const stats = await trackingService.getLocationStats(userId, 30);
```

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Invalid coordinates, missing required fields
- **Database Errors**: Connection issues, constraint violations
- **Socket Errors**: Connection failures, authentication issues
- **Rate Limiting**: Prevent spam location updates

## Production Considerations

### 1. Rate Limiting
Implement rate limiting to prevent location update spam:

```typescript
// Example rate limiting middleware
const rateLimit = require('express-rate-limit');

const locationUpdateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 updates per second per IP
  message: 'Too many location updates'
});
```

### 2. Database Optimization
- Index on `(userId, createdAt)` for fast queries
- Consider partitioning by date for large datasets
- Implement cleanup jobs for old location data

### 3. Scalability
- Use Redis adapter for multiple server instances
- Implement horizontal scaling with load balancers
- Consider using Redis for room management

### 4. Monitoring
- Log all location updates for analytics
- Monitor room sizes and connection counts
- Track error rates and performance metrics

## Security Considerations

1. **Authentication**: All socket connections require valid JWT tokens
2. **Authorization**: Users can only join rooms they have access to
3. **Input Validation**: All location data is validated before processing
4. **Rate Limiting**: Prevent abuse of location update endpoints
5. **Data Privacy**: Consider GDPR compliance for location data

## Testing

```typescript
// Example test for location tracking
describe('Location Tracking', () => {
  it('should join room and receive location updates', async () => {
    const client = io('http://localhost:3000', {
      auth: { token: 'test-token' }
    });

    await new Promise(resolve => client.on('connect', resolve));

    // Join room
    client.emit('join_room', { roomName: 'test_room' });

    // Update location
    client.emit('update_location', {
      roomName: 'test_room',
      userId: 123,
      lat: 40.7128,
      lng: -74.0060
    });

    // Should receive location update
    const locationUpdate = await new Promise(resolve => {
      client.on('location_update', resolve);
    });

    expect(locationUpdate.roomName).toBe('test_room');
    expect(locationUpdate.location.userId).toBe(123);
  });
});
```

This system provides a robust, scalable foundation for real-time logistics and tracking applications with comprehensive error handling, validation, and production-ready features.
