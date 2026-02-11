import { Socket } from "socket.io";
import { Server as SocketIOServer } from "socket.io";

/**
 * Extended Socket interface with authentication data
 */
export interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: any;
}

/**
 * User session data
 */
export interface UserSessionData {
  userId: number;
  socketId: string;
}

/**
 * Cached user details
 */
export interface CachedUserDetails {
  data: any;
  timestamp: number;
}

/**
 * Online user data
 */
export interface OnlineUserData {
  userId: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  profileImage?: string;
  lastOnline: string;
  isOnline: boolean;
}

/**
 * Socket event payload interfaces
 */
export interface UserStatusUpdatePayload {
  userId: number;
  isOnline: boolean;
  timestamp: Date;
}

export interface OnlineUsersListPayload {
  users: OnlineUserData[];
  count: number;
  timestamp: string;
}

export interface TypingEventPayload {
  userId: number;
  userName: string;
  conversationId: number;
  timestamp: string;
}

export interface MessageReadPayload {
  conversationId: number;
  readByUserId: number;
  readAt: string;
  timestamp: Date;
}

export interface MessageDeliveredPayload {
  conversationId: number;
  messageId: number;
  deliveredToUserId: number;
  timestamp: Date;
}

export interface MessageReceivedPayload {
  messageId: number;
  conversationId: number;
  receivedByUserId: number;
  receivedAt: string;
  timestamp: Date;
}

export interface JobAssignedPayload {
  jobId: number;
  driverId: number;
  companyId: number;
  timestamp: Date;
}

export interface ContractDriverPayload {
  contractId: number;
  driverUserId: number;
  timestamp: Date;
}

export interface ContractDriverChangedPayload {
  contractId: number;
  newDriverUserId: number;
  oldDriverUserId?: number | null;
  reason?: string;
  timestamp: Date;
}

export interface ContractDriverRemovedPayload {
  contractId: number;
  driverUserId: number;
  reason?: string;
  timestamp: Date;
}

export interface ContractDriverVisibilityPayload {
  contractId: number;
  driverUserId: number;
  isLocationVisible: boolean;
  timestamp: Date;
}

export interface SystemMessagePayload {
  conversationId: number;
  message: string;
  metadata?: any;
  timestamp: Date;
}

export interface ErrorPayload {
  error: string;
  details?: any;
  timestamp: Date;
}

export interface TypingErrorPayload {
  type: string;
  message: string;
  conversationId: number;
  error: string;
  timestamp: string;
}

/**
 * Socket service configuration
 */
export interface SocketServiceConfig {
  cors: {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
  };
}

/**
 * Handler interface for socket event handlers
 */
export interface SocketEventHandler {
  handle(socket: AuthenticatedSocket, data?: any): Promise<void> | void;
}

/**
 * Socket service dependencies
 */
export interface SocketServiceDependencies {
  chatService: any;
  userService: any;
  logger: any;
}

/**
 * Room management interface
 */
export interface RoomManager {
  joinUserToPersonalRoom(socket: AuthenticatedSocket): void;
  joinUserToConversation(socket: AuthenticatedSocket, conversationId: number): void;
  leaveConversation(socket: AuthenticatedSocket, conversationId: number): void;
  joinUserToConversations(socket: AuthenticatedSocket): Promise<void>;
}

/**
 * Cache service interface
 */
export interface CacheService {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  isExpired(timestamp: number): boolean;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  emit(event: string, data: any): void;
  to(room: string): EventEmitter;
}

/**
 * Socket service interface
 */
export interface ISocketService {
  getSocketInstance(): SocketIOServer;
  getOnlineUsers(): number[];
  getOnlineUserCount(): number;
  isUserOnline(userId: number): boolean;
  getOnlineUserIds(): number[];
  clearUserCache(userId: number): void;
  broadcastOnlineUsersList(): Promise<void>;
}
