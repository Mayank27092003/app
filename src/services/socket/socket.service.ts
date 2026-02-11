import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Logger } from "../../utils/logger";
import { ChatService } from "../chat";

// Import handlers
import { AuthHandler } from "./handlers/auth.handler";
import { ConnectionHandler } from "./handlers/connection.handler";
import { ConversationHandler } from "./handlers/conversation.handler";
import { OnlineStatusHandler } from "./handlers/online-status.handler";
import { ErrorHandler } from "./handlers/error.handler";
import { JobEventsHandler } from "./handlers/job-events.handler";
import { ContractEventsHandler } from "./handlers/contract-events.handler";
import { MessageEventsHandler } from "./handlers/message-events.handler";
import { LocationTrackingHandler } from "./handlers/location-tracking.handler";
import { RoomHandler } from "./handlers/room.handler";
import { WebRTCHandler } from "./handlers/webrtc.handler";

// Import services
import { UserDetailsCacheService } from "./services/cache.service";

// Import types and constants
import { AuthenticatedSocket, ISocketService, SocketServiceConfig } from "./types";
import { CONNECTION_EVENTS, CONVERSATION_EVENTS, LOCATION_EVENTS, WEBRTC_EVENTS } from "./constants/events";

/**
 * Refactored SocketService with modular architecture
 * Follows DRY principles and proper separation of concerns
 */
export class SocketService implements ISocketService {
  private io: SocketIOServer;
  private config: SocketServiceConfig;

  // Handlers
  private authHandler!: AuthHandler;
  private connectionHandler!: ConnectionHandler;
  private conversationHandler!: ConversationHandler;
  private onlineStatusHandler!: OnlineStatusHandler;
  private errorHandler!: ErrorHandler;
  private jobEventsHandler!: JobEventsHandler;
  private contractEventsHandler!: ContractEventsHandler;
  private messageEventsHandler!: MessageEventsHandler;
  private locationTrackingHandler!: LocationTrackingHandler;
  private roomHandler!: RoomHandler;
  private webrtcHandler!: WebRTCHandler;

  // Services
  private cacheService!: UserDetailsCacheService;
  private chatService!: ChatService;

  constructor(httpServer: HTTPServer) {
    this.config = {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    };

    this.io = new SocketIOServer(httpServer, this.config);
    this.initializeServices();
    this.initializeHandlers();
    this.setupMiddleware();
    this.setupEventHandlers();

    Logger.info("Socket.IO service initialized with modular architecture");
  }

  /**
   * Initialize services
   */
  private initializeServices(): void {
    this.cacheService = new UserDetailsCacheService();
    this.chatService = new ChatService();
  }

  /**
   * Initialize handlers
   */
  private initializeHandlers(): void {
    this.authHandler = new AuthHandler();
    this.connectionHandler = new ConnectionHandler();
    this.onlineStatusHandler = new OnlineStatusHandler(this.io, this.cacheService);
    this.conversationHandler = new ConversationHandler(this.io, this.onlineStatusHandler);
    this.errorHandler = new ErrorHandler(this.io);
    this.jobEventsHandler = new JobEventsHandler(this.io);
    this.contractEventsHandler = new ContractEventsHandler(this.io);
    this.messageEventsHandler = new MessageEventsHandler(this.io);
    this.locationTrackingHandler = new LocationTrackingHandler(this.io);
    this.roomHandler = new RoomHandler(this.io);
    this.webrtcHandler = new WebRTCHandler(this.io);
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.authHandler.setupMiddleware(this.io);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on(CONNECTION_EVENTS.CONNECTION, async (socket: AuthenticatedSocket) => {
      try {
        // Validate authentication
        if (!this.authHandler.validateSocket(socket)) {
          socket.disconnect();
          return;
        }

        // Handle user connection
        await this.connectionHandler.handleConnection(socket);

        // Add user to online status
        this.onlineStatusHandler.addUserToOnlineList(socket.userId!);

        // Join user to their conversations
        await this.conversationHandler.joinUserToConversations(socket);

        // Send online users list to the newly connected user
        await this.onlineStatusHandler.sendOnlineUsersList(socket);

        // Emit user online status
        await this.onlineStatusHandler.emitUserOnlineStatus(socket.userId!, true);

        // Setup event listeners
        this.setupSocketEventListeners(socket);

        Logger.info(`User ${socket.userId} connected with socket ${socket.id}`);
      } catch (error: any) {
        Logger.error(`Error in socket connection: ${error?.message || 'Unknown error'}`);
        this.errorHandler.handleConnectionError(socket, error);
        socket.disconnect();
      }
    });
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEventListeners(socket: AuthenticatedSocket): void {
    // Conversation events
    socket.on(CONVERSATION_EVENTS.JOIN_CONVERSATION, async (conversationId: number) => {
      try {
        await this.conversationHandler.handleJoinConversation(socket, conversationId);
      } catch (error: any) {
        this.errorHandler.handleConversationError(socket, conversationId, error);
      }
    });

    socket.on(CONVERSATION_EVENTS.LEAVE_CONVERSATION, async (conversationId: number) => {
      try {
        await this.conversationHandler.handleLeaveConversation(socket, conversationId);
      } catch (error: any) {
        this.errorHandler.handleConversationError(socket, conversationId, error);
      }
    });

    socket.on(CONVERSATION_EVENTS.TYPING_START, async (data: { conversationId: number }) => {
      try {
        await this.conversationHandler.handleTypingStart(socket, data.conversationId);
      } catch (error: any) {
        this.errorHandler.handleTypingError(socket, data.conversationId, error);
      }
    });

    socket.on(CONVERSATION_EVENTS.TYPING_STOP, async (data: { conversationId: number }) => {
      try {
        await this.conversationHandler.handleTypingStop(socket, data.conversationId);
      } catch (error: any) {
        this.errorHandler.handleTypingError(socket, data.conversationId, error);
      }
    });

    // Generic room events
    socket.on(LOCATION_EVENTS.JOIN_ROOM, async (data: { rooms: string | string[] }) => {
      try {
        await this.roomHandler.handleJoinRoom(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "join_room");
      }
    });

    socket.on(LOCATION_EVENTS.LEAVE_ROOM, async (data: { rooms: string | string[] }) => {
      try {
        await this.roomHandler.handleLeaveRoom(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "leave_room");
      }
    });

    // Location tracking events - simplified
    socket.on(LOCATION_EVENTS.UPDATE_LOCATION, async (data: {
      userId: number;
      lat: number;
      lng: number;
      speed?: number;
      heading?: number;
      battery?: number;
      accuracy?: number;
      provider?: string;
    }) => {
      try {
        await this.locationTrackingHandler.handleLocationUpdate(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "update_location");
      }
    });

    // WebRTC events
    socket.on(WEBRTC_EVENTS.CALL_INCOMING, async (data: any) => {
      try {
        await this.webrtcHandler.handleIncomingCall(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_incoming");
      }
    });

    socket.on(WEBRTC_EVENTS.CALL_ACCEPTED, async (data: any) => {
      try {
        await this.webrtcHandler.handleCallAccepted(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_accepted");
      }
    });

    socket.on(WEBRTC_EVENTS.CALL_DECLINED, async (data: any) => {
      try {
        await this.webrtcHandler.handleCallDeclined(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_declined");
      }
    });

    socket.on(WEBRTC_EVENTS.CALL_ENDED, async (data: any) => {
      try {
        await this.webrtcHandler.handleCallEnded(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_ended");
      }
    });

    socket.on(WEBRTC_EVENTS.WEBRTC_SIGNALING, async (data: any) => {
      try {
        await this.webrtcHandler.handleWebRTCSignaling(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "webrtc_signaling");
      }
    });

    socket.on(WEBRTC_EVENTS.CALL_JOINED, async (data: any) => {
      try {
        await this.webrtcHandler.handleCallJoined(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_joined");
      }
    });

    socket.on(WEBRTC_EVENTS.CALL_STATUS_UPDATE, async (data: any) => {
      try {
        await this.webrtcHandler.handleCallStatusUpdate(socket, data);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "call_status_update");
      }
    });

    // Disconnect event
    socket.on(CONNECTION_EVENTS.DISCONNECT, async () => {
      try {
        await this.connectionHandler.handleDisconnection(socket);
        this.onlineStatusHandler.removeUserFromOnlineList(socket.userId!);
        await this.onlineStatusHandler.emitUserOnlineStatus(socket.userId!, false);
      } catch (error: any) {
        this.errorHandler.handleSocketError(socket, error, "disconnection");
      }
    });
  }

  // Public methods for external services to emit events

  /**
   * Job Events
   */
  public emitJobCreated(jobData: any): void {
    this.jobEventsHandler.emitJobCreated(jobData);
  }

  public emitJobAssigned(jobId: number, driverId: number, companyId: number): void {
    this.jobEventsHandler.emitJobAssigned(jobId, driverId, companyId);
  }

  public emitJobCompleted(contractId: number, escrowAmount: number): void {
    this.jobEventsHandler.emitJobCompleted(contractId, escrowAmount);
  }

  /**
   * Contract Events
   */
  public emitContractCreated(contractId: number, contractData: any): void {
    this.contractEventsHandler.emitContractCreated(contractId, contractData);
  }

  public emitContractStarted(contractId: number, escrowAmount: number): void {
    this.contractEventsHandler.emitContractStarted(contractId, escrowAmount);
  }

  public emitContractDriverAdded(contractId: number, driverUserId: number, conversationId?: number): void {
    this.contractEventsHandler.emitContractDriverAdded(contractId, driverUserId, conversationId);
  }

  public emitContractDriverRemoved(contractId: number, driverUserId: number, reason?: string, conversationId?: number): void {
    this.contractEventsHandler.emitContractDriverRemoved(contractId, driverUserId, reason, conversationId);
  }

  public emitContractDriverChanged(contractId: number, newDriverUserId: number, oldDriverUserId?: number | null, reason?: string, conversationId?: number): void {
    this.contractEventsHandler.emitContractDriverChanged(contractId, newDriverUserId, oldDriverUserId, reason, conversationId);
  }

  public emitContractDriverInvited(contractId: number, driverUserId: number): void {
    this.contractEventsHandler.emitContractDriverInvited(contractId, driverUserId);
  }

  public emitContractDriverAccepted(contractId: number, driverUserId: number, conversationId?: number): void {
    this.contractEventsHandler.emitContractDriverAccepted(contractId, driverUserId, conversationId);
  }

  public emitContractDriverDeclined(contractId: number, driverUserId: number, reason?: string): void {
    this.contractEventsHandler.emitContractDriverDeclined(contractId, driverUserId, reason);
  }

  public emitContractDriverVisibilityChanged(contractId: number, driverUserId: number, isLocationVisible: boolean): void {
    this.contractEventsHandler.emitContractDriverVisibilityChanged(contractId, driverUserId, isLocationVisible);
  }

  public emitContractCarrierInvited(contractId: number, carrierUserId: number): void {
    this.contractEventsHandler.emitContractCarrierInvited(contractId, carrierUserId);
  }

  public emitContractCarrierAccepted(contractId: number, carrierUserId: number): void {
    this.contractEventsHandler.emitContractCarrierAccepted(contractId, carrierUserId);
  }

  public emitContractCarrierDeclined(contractId: number, carrierUserId: number, reason?: string): void {
    this.contractEventsHandler.emitContractCarrierDeclined(contractId, carrierUserId, reason);
  }

  /**
   * Message Events
   */
  public emitSystemMessage(conversationId: number, message: string, metadata?: any): void {
    this.messageEventsHandler.emitSystemMessage(conversationId, message, metadata);
  }

  public emitNewMessage(conversationId: number, messageData: any): void {
    this.messageEventsHandler.emitNewMessage(conversationId, messageData);
  }

  public emitMessageRead(conversationId: number, readByUserId: number, readAt: string): void {
    this.messageEventsHandler.emitMessageRead(conversationId, readByUserId, readAt);
  }

  public emitMessageDelivered(conversationId: number, messageId: number, deliveredToUserId: number, senderUserId: number): void {
    this.messageEventsHandler.emitMessageDelivered(conversationId, messageId, deliveredToUserId, senderUserId);
  }

  public emitMessageReceived(messageId: number, conversationId: number, receivedByUserId: number, senderUserId: number): void {
    this.messageEventsHandler.emitMessageReceived(messageId, conversationId, receivedByUserId, senderUserId);
  }

  /**
   * Location Tracking Events
   */
  public emitLocationUpdate(roomName: string, locationData: any): void {
    this.io.to(roomName).emit(LOCATION_EVENTS.LOCATION_UPDATE, {
      roomName,
      location: locationData
    });
  }

  public emitLocationUpdateToRooms(rooms: string[], locationData: any): void {
    for (const room of rooms) {
      this.emitLocationUpdate(room, locationData);
    }
  }

  /**
   * Error Events
   */
  public emitError(userId: number, error: string, details?: any): void {
    this.errorHandler.emitErrorToUser(userId, error, details);
  }

  public emitErrorToRoom(room: string, error: string, details?: any): void {
    this.errorHandler.emitErrorToRoom(room, error, details);
  }

  public emitErrorToAll(error: string, details?: any): void {
    this.errorHandler.emitErrorToAll(error, details);
  }

  // Interface implementation

  public getSocketInstance(): SocketIOServer {
    return this.io;
  }

  public getOnlineUsers(): number[] {
    return this.connectionHandler.getOnlineUsers();
  }

  public getOnlineUserCount(): number {
    return this.connectionHandler.getOnlineUserCount();
  }

  public isUserOnline(userId: number): boolean {
    return this.connectionHandler.isUserOnline(userId);
  }

  public getOnlineUserIds(): number[] {
    return this.connectionHandler.getOnlineUserIds();
  }

  public clearUserCache(userId: number): void {
    this.onlineStatusHandler.clearUserCache(userId);
  }

  public async broadcastOnlineUsersList(): Promise<void> {
    await this.onlineStatusHandler.broadcastOnlineUsersList();
  }

  // Additional utility methods

  /**
   * Get conversation handler for advanced operations
   */
  public getConversationHandler(): ConversationHandler {
    return this.conversationHandler;
  }

  /**
   * Get online status handler for advanced operations
   */
  public getOnlineStatusHandler(): OnlineStatusHandler {
    return this.onlineStatusHandler;
  }

  /**
   * Get error handler for advanced operations
   */
  public getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get location tracking handler for advanced operations
   */
  public getLocationTrackingHandler(): LocationTrackingHandler {
    return this.locationTrackingHandler;
  }

  /**
   * Clean expired cache entries
   */
  public cleanExpiredCache(): number {
    return this.cacheService.cleanExpired();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return this.cacheService.getStats();
  }
}
