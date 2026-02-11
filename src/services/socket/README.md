# Socket Service - Modular Architecture

This directory contains a refactored, modular socket service that follows DRY principles and proper separation of concerns. The architecture is designed to be scalable, maintainable, and easy to extend.

## 📁 Directory Structure

```
src/services/socket/
├── constants/
│   └── events.ts              # Centralized event constants
├── handlers/
│   ├── auth.handler.ts        # Authentication handling
│   ├── connection.handler.ts  # User connection/disconnection
│   ├── conversation.handler.ts # Conversation events (join/leave/typing)
│   ├── online-status.handler.ts # Online status management
│   ├── error.handler.ts       # Error handling
│   ├── job-events.handler.ts  # Job-related events
│   ├── contract-events.handler.ts # Contract-related events
│   └── message-events.handler.ts # Message-related events
├── services/
│   └── cache.service.ts       # User details caching
├── types/
│   └── index.ts              # TypeScript interfaces and types
├── socket.service.ts         # Main SocketService class
├── index.ts                  # Public exports
├── instance.ts               # Singleton instance management
└── README.md                 # This file
```

## 🏗️ Architecture Overview

### Core Principles

1. **Single Responsibility**: Each handler is responsible for one specific domain
2. **DRY (Don't Repeat Yourself)**: Event constants are centralized and reused
3. **Separation of Concerns**: Business logic is separated from socket management
4. **Scalability**: Easy to add new handlers and events
5. **Maintainability**: Clear structure makes code easy to understand and modify

### Key Components

#### 1. Event Constants (`constants/events.ts`)
- Centralized event names to prevent typos
- Type-safe event constants
- Easy to maintain and update

#### 2. Handlers (`handlers/`)
Each handler manages a specific domain:

- **AuthHandler**: JWT token verification and authentication
- **ConnectionHandler**: User connection/disconnection management
- **ConversationHandler**: Conversation joining, leaving, and typing indicators
- **OnlineStatusHandler**: User online status and user lists
- **ErrorHandler**: Centralized error handling and emission
- **JobEventsHandler**: Job-related event emissions
- **ContractEventsHandler**: Contract-related event emissions
- **MessageEventsHandler**: Message-related event emissions

#### 3. Services (`services/`)
- **CacheService**: User details caching with TTL support

#### 4. Types (`types/index.ts`)
- Comprehensive TypeScript interfaces
- Type-safe payload definitions
- Clear contract definitions

## 🚀 Usage

### Basic Usage

```typescript
import { initializeSocket } from './services/socket/instance';

// Initialize socket service
const socketService = initializeSocket(httpServer);
```

### Emitting Events

```typescript
import { 
  emitJobCreated, 
  emitContractCreated, 
  emitNewMessage 
} from './services/socket/instance';

// Emit job events
emitJobCreated(jobData);
emitJobAssigned(jobId, driverId, companyId);

// Emit contract events
emitContractCreated(contractId, contractData);
emitContractDriverAdded(contractId, driverUserId);

// Emit message events
emitNewMessage(conversationId, messageData);
emitMessageRead(conversationId, userId, readAt);
```

### Using Event Constants

```typescript
import { CONVERSATION_EVENTS, JOB_EVENTS } from './services/socket/constants/events';

// Use constants instead of magic strings
socket.emit(CONVERSATION_EVENTS.JOIN_CONVERSATION, conversationId);
socket.emit(JOB_EVENTS.JOB_NEW, jobData);
```

## 🔧 Adding New Events

### 1. Add Event Constants

```typescript
// In constants/events.ts
export const NEW_FEATURE_EVENTS = {
  FEATURE_CREATED: 'feature_created',
  FEATURE_UPDATED: 'feature_updated',
} as const;
```

### 2. Create Handler (if needed)

```typescript
// In handlers/new-feature.handler.ts
export class NewFeatureHandler {
  constructor(private io: any) {}

  emitFeatureCreated(featureData: any): void {
    this.io.emit(NEW_FEATURE_EVENTS.FEATURE_CREATED, {
      ...featureData,
      timestamp: new Date(),
    });
  }
}
```

### 3. Add to Main Service

```typescript
// In socket.service.ts
private newFeatureHandler!: NewFeatureHandler;

// In initializeHandlers()
this.newFeatureHandler = new NewFeatureHandler(this.io);

// Add public method
public emitFeatureCreated(featureData: any): void {
  this.newFeatureHandler.emitFeatureCreated(featureData);
}
```

### 4. Export from Instance

```typescript
// In instance.ts
export function emitFeatureCreated(featureData: any): void {
  if (socketService) {
    socketService.emitFeatureCreated(featureData);
  }
}
```

## 📊 Benefits

### Before Refactoring
- ❌ Single 800+ line file
- ❌ Mixed concerns
- ❌ Hard to maintain
- ❌ Difficult to test
- ❌ Magic strings for events
- ❌ Repeated code

### After Refactoring
- ✅ Modular architecture
- ✅ Clear separation of concerns
- ✅ Easy to maintain and extend
- ✅ Type-safe event constants
- ✅ Reusable components
- ✅ Better testability
- ✅ DRY principles followed

## 🧪 Testing

Each handler can be tested independently:

```typescript
import { JobEventsHandler } from './handlers/job-events.handler';

describe('JobEventsHandler', () => {
  let handler: JobEventsHandler;
  let mockIO: any;

  beforeEach(() => {
    mockIO = { emit: jest.fn() };
    handler = new JobEventsHandler(mockIO);
  });

  it('should emit job created event', () => {
    const jobData = { id: 1, title: 'Test Job' };
    handler.emitJobCreated(jobData);
    
    expect(mockIO.emit).toHaveBeenCalledWith('job:new', {
      ...jobData,
      timestamp: expect.any(Date),
    });
  });
});
```

## 🔄 Migration Guide

### For Existing Code

1. **Import Changes**: Update imports to use the new structure
2. **Event Names**: Use constants instead of magic strings
3. **Error Handling**: Use the centralized error handler
4. **Type Safety**: Use the new TypeScript interfaces

### Example Migration

```typescript
// Before
socket.emit('job:new', jobData);

// After
import { JOB_EVENTS } from './constants/events';
socket.emit(JOB_EVENTS.JOB_NEW, jobData);
```

## 🚨 Important Notes

1. **Event Constants**: Always use constants from `constants/events.ts`
2. **Error Handling**: Use the ErrorHandler for consistent error management
3. **Type Safety**: Use the provided TypeScript interfaces
4. **Testing**: Test handlers independently for better coverage
5. **Documentation**: Update this README when adding new features

## 📈 Performance Considerations

- **Caching**: User details are cached to reduce database queries
- **Memory Management**: Cache has TTL and cleanup mechanisms
- **Event Batching**: Events can be batched for better performance
- **Connection Pooling**: Efficient connection management

## 🔍 Debugging

Enable debug logging by setting the appropriate log level:

```typescript
// In your environment
LOG_LEVEL=debug
```

This will provide detailed information about socket events, connections, and errors.

## 🤝 Contributing

When adding new features:

1. Follow the existing patterns
2. Add proper TypeScript types
3. Include error handling
4. Update this README
5. Add tests for new functionality
6. Use event constants consistently

## 📝 Changelog

### v2.0.0 - Modular Architecture
- ✅ Refactored monolithic socket service into modular handlers
- ✅ Added centralized event constants
- ✅ Implemented proper TypeScript interfaces
- ✅ Added comprehensive error handling
- ✅ Improved caching mechanisms
- ✅ Enhanced maintainability and scalability
