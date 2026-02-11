import { Logger } from "../../../utils/logger";
import { ConversationParticipant } from "../../../models";
import { AuthenticatedSocket, TypingEventPayload, TypingErrorPayload } from "../types";
import { CONVERSATION_EVENTS, ROOM_PREFIXES, ERROR_EVENTS } from "../constants/events";
import { OnlineStatusHandler } from "./online-status.handler";

/**
 * Conversation handler for socket events
 * Manages conversation joining, leaving, and typing indicators
 */
export class ConversationHandler {
  private logger: typeof Logger;
  private io: any;
  private onlineStatusHandler: OnlineStatusHandler;

  constructor(io: any, onlineStatusHandler: OnlineStatusHandler) {
    this.logger = Logger;
    this.io = io;
    this.onlineStatusHandler = onlineStatusHandler;
  }

  /**
   * Handle join conversation event
   */
  async handleJoinConversation(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
    try {
      // Leave previous conversation rooms
      this.leavePreviousConversations(socket);

      // Join new conversation room
      const conversationRoom = `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
      socket.join(conversationRoom);

      this.logger.info(
        `User ${socket.userId} joined conversation ${conversationId}`
      );
    } catch (error: any) {
      this.logger.error(`Error joining conversation: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Handle leave conversation event
   */
  async handleLeaveConversation(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
    try {
      const conversationRoom = `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
      socket.leave(conversationRoom);

      this.logger.info(`User ${socket.userId} left conversation ${conversationId}`);
    } catch (error: any) {
      this.logger.error(`Error leaving conversation: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Handle typing start event
   */
  async handleTypingStart(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
    try {
      const userId = socket.userId!;
      
      // Get user details using OnlineStatusHandler (handles caching and fallback)
      const userDetails = await this.onlineStatusHandler.getUserDetails(userId);
      const userName = userDetails?.userName || userDetails?.firstName || `User ${userId}`;
      
      // Get all active participants (excluding those who left and the current user)
      const participants = await this.getActiveParticipants(conversationId, userId);

      if (participants.length === 0) {
        this.logger.warn(`No active participants found for conversation ${conversationId}`);
        return;
      }

      const payload: TypingEventPayload = {
        userId,
        userName,
        conversationId,
        timestamp: new Date().toISOString()
      };

      // Emit to all active participants' personal rooms
      participants.forEach((participant) => {
        this.io.to(`${ROOM_PREFIXES.USER}${participant.userId}`).emit(CONVERSATION_EVENTS.USER_TYPING_START, payload);
      });

      // Also emit to conversation room for real-time updates
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONVERSATION_EVENTS.USER_TYPING_START, payload);

      this.logger.info(`User ${userId} started typing in conversation ${conversationId}`);
    } catch (error: any) {
      this.logger.error(`Error handling typing start: ${error?.message || 'Unknown error'}`);
      this.emitTypingError(socket, conversationId, error);
    }
  }

  /**
   * Handle typing stop event
   */
  async handleTypingStop(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
    try {
      const userId = socket.userId!;
      
      // Get user details using OnlineStatusHandler (handles caching and fallback)
      const userDetails = await this.onlineStatusHandler.getUserDetails(userId);
      const userName = userDetails?.userName || userDetails?.firstName || `User ${userId}`;
      
      // Get all active participants (excluding those who left and the current user)
      const participants = await this.getActiveParticipants(conversationId, userId);

      if (participants.length === 0) {
        this.logger.warn(`No active participants found for conversation ${conversationId}`);
        return;
      }

      const payload: TypingEventPayload = {
        userId,
        userName,
        conversationId,
        timestamp: new Date().toISOString()
      };

      // Emit to all active participants' personal rooms
      participants.forEach((participant) => {
        this.io.to(`${ROOM_PREFIXES.USER}${participant.userId}`).emit(CONVERSATION_EVENTS.USER_TYPING_STOP, payload);
      });

      // Also emit to conversation room for real-time updates
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONVERSATION_EVENTS.USER_TYPING_STOP, payload);

      this.logger.info(`User ${userId} stopped typing in conversation ${conversationId}`);
    } catch (error: any) {
      this.logger.error(`Error handling typing stop: ${error?.message || 'Unknown error'}`);
      this.emitTypingError(socket, conversationId, error);
    }
  }

  /**
   * Join user to all their conversations
   */
  async joinUserToConversations(socket: AuthenticatedSocket): Promise<void> {
    try {
      const userId = socket.userId!;
      
      // Get all conversations where user is a participant
      const conversations = await ConversationParticipant.query()
        .where({ userId })
        .whereNull("leftAt")
        .select("conversationId");

      // Join user to all their conversation rooms
      for (const conv of conversations) {
        const conversationRoom = `${ROOM_PREFIXES.CONVERSATION}${conv.conversationId}`;
        socket.join(conversationRoom);
        this.logger.info(`User ${userId} joined conversation room: ${conversationRoom}`);
      }

      this.logger.info(`User ${userId} joined ${conversations.length} conversation rooms`);
    } catch (error: any) {
      this.logger.error(`Error joining user to conversations: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Leave previous conversation rooms
   */
  private leavePreviousConversations(socket: AuthenticatedSocket): void {
    const rooms = Array.from(socket.rooms);
    const conversationRooms = rooms.filter((room) =>
      room.startsWith(ROOM_PREFIXES.CONVERSATION)
    );
    conversationRooms.forEach((room) => socket.leave(room));
  }

  /**
   * Get active participants for a conversation
   */
  private async getActiveParticipants(conversationId: number, excludeUserId: number): Promise<{ userId: number }[]> {
    return await ConversationParticipant.query()
      .where({ conversationId })
      .whereNull("leftAt")
      .whereNot('userId', excludeUserId)
      .select('userId');
  }

  /**
   * Emit typing error to user
   */
  private emitTypingError(socket: AuthenticatedSocket, conversationId: number, error: any): void {
    const payload: TypingErrorPayload = {
      type: ERROR_EVENTS.TYPING_ERROR,
      message: "Failed to process typing event",
      conversationId,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };

    socket.emit(ERROR_EVENTS.ERROR, payload);
  }

  /**
   * Get conversation room name
   */
  getConversationRoom(conversationId: number): string {
    return `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
  }

  /**
   * Get user room name
   */
  getUserRoom(userId: number): string {
    return `${ROOM_PREFIXES.USER}${userId}`;
  }
}
