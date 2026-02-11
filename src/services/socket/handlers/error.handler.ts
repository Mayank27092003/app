import { Logger } from "../../../utils/logger";
import { AuthenticatedSocket, ErrorPayload } from "../types";
import { ERROR_EVENTS, ROOM_PREFIXES } from "../constants/events";

/**
 * Error handler for socket events
 * Centralized error handling and error event emission
 */
export class ErrorHandler {
  private logger: typeof Logger;
  private io: any;

  constructor(io: any) {
    this.logger = Logger;
    this.io = io;
  }

  /**
   * Emit error to specific user
   */
  emitErrorToUser(userId: number, error: string, details?: any): void {
    const payload: ErrorPayload = {
      error,
      details,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${userId}`).emit(ERROR_EVENTS.ERROR, payload);
    this.logger.error(`Error emitted to user ${userId}: ${error}`);
  }

  /**
   * Emit error to specific room
   */
  emitErrorToRoom(room: string, error: string, details?: any): void {
    const payload: ErrorPayload = {
      error,
      details,
      timestamp: new Date(),
    };

    this.io.to(room).emit(ERROR_EVENTS.ERROR, payload);
    this.logger.error(`Error emitted to room ${room}: ${error}`);
  }

  /**
   * Emit error to all connected users
   */
  emitErrorToAll(error: string, details?: any): void {
    const payload: ErrorPayload = {
      error,
      details,
      timestamp: new Date(),
    };

    this.io.emit(ERROR_EVENTS.ERROR, payload);
    this.logger.error(`Error emitted to all users: ${error}`);
  }

  /**
   * Emit error to socket
   */
  emitErrorToSocket(socket: AuthenticatedSocket, error: string, details?: any): void {
    const payload: ErrorPayload = {
      error,
      details,
      timestamp: new Date(),
    };

    socket.emit(ERROR_EVENTS.ERROR, payload);
    this.logger.error(`Error emitted to socket ${socket.id}: ${error}`);
  }

  /**
   * Handle connection error
   */
  handleConnectionError(socket: AuthenticatedSocket, error: any): void {
    this.logger.error(`Connection error for socket ${socket.id}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Connection failed", {
      type: "connection_error",
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle authentication error
   */
  handleAuthError(socket: AuthenticatedSocket, error: any): void {
    this.logger.error(`Authentication error for socket ${socket.id}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Authentication failed", {
      type: "auth_error",
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle conversation error
   */
  handleConversationError(socket: AuthenticatedSocket, conversationId: number, error: any): void {
    this.logger.error(`Conversation error for socket ${socket.id} in conversation ${conversationId}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Conversation operation failed", {
      type: "conversation_error",
      conversationId,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle message error
   */
  handleMessageError(socket: AuthenticatedSocket, messageId: number, error: any): void {
    this.logger.error(`Message error for socket ${socket.id} for message ${messageId}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Message operation failed", {
      type: "message_error",
      messageId,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle job error
   */
  handleJobError(socket: AuthenticatedSocket, jobId: number, error: any): void {
    this.logger.error(`Job error for socket ${socket.id} for job ${jobId}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Job operation failed", {
      type: "job_error",
      jobId,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle contract error
   */
  handleContractError(socket: AuthenticatedSocket, contractId: number, error: any): void {
    this.logger.error(`Contract error for socket ${socket.id} for contract ${contractId}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Contract operation failed", {
      type: "contract_error",
      contractId,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle typing error
   */
  handleTypingError(socket: AuthenticatedSocket, conversationId: number, error: any): void {
    this.logger.error(`Typing error for socket ${socket.id} in conversation ${conversationId}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Typing operation failed", {
      type: ERROR_EVENTS.TYPING_ERROR,
      conversationId,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Handle general socket error
   */
  handleSocketError(socket: AuthenticatedSocket, error: any, context?: string): void {
    const contextInfo = context ? ` in ${context}` : '';
    this.logger.error(`Socket error for socket ${socket.id}${contextInfo}: ${error?.message || 'Unknown error'}`);
    this.emitErrorToSocket(socket, "Socket operation failed", {
      type: "socket_error",
      context,
      message: error?.message || 'Unknown error'
    });
  }

  /**
   * Log error with context
   */
  logError(error: any, context: string, additionalInfo?: any): void {
    this.logger.error(`${context}: ${error?.message || 'Unknown error'}` + additionalInfo);
  }

  /**
   * Create standardized error payload
   */
  createErrorPayload(error: string, type: string, details?: any): ErrorPayload {
    return {
      error,
      details: {
        type,
        ...details
      },
      timestamp: new Date(),
    };
  }
}
