import { AuthenticatedSocket } from "../types";
import { Logger } from "../../../utils/logger";
import { WebRTCService } from "../../webrtc";
import { WEBRTC_EVENTS } from "../constants/events";

export class WebRTCHandler {
  private io: any;
  private logger: typeof Logger;
  private webrtcService: WebRTCService;

  constructor(io: any) {
    this.io = io;
    this.logger = Logger;
    this.webrtcService = new WebRTCService();
  }

  /**
   * Handle incoming call event
   */
  async handleIncomingCall(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, conversationId, callerId, receiverId, callType } = data;

      if (!callSessionId || !conversationId || !callerId || !receiverId || !callType) {
        this.logger.error("Invalid incoming call data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid call data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify the receiver is the socket user
      if (socket.userId !== receiverId) {
        this.logger.error(`User ${socket.userId} attempted to receive call for user ${receiverId}`);
        return;
      }

      this.logger.info(`Incoming call ${callSessionId} for user ${receiverId}`);
      
      // Emit incoming call event to the receiver
      socket.emit(WEBRTC_EVENTS.CALL_INCOMING, {
        callSessionId,
        conversationId,
        callerId,
        receiverId,
        callType,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling incoming call: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle incoming call",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle call accepted event
   */
  async handleCallAccepted(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, conversationId, timestamp } = data;

      if (!callSessionId || !conversationId) {
        this.logger.error("Invalid call accepted data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid call accepted data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.info(`Call accepted: ${callSessionId}`);
      
      // Emit call accepted event to other participants (not the sender)
      socket.to(`conversation:${conversationId}`).emit(WEBRTC_EVENTS.CALL_ACCEPTED, {
        callSessionId,
        conversationId,
        acceptedByUserId: socket.userId,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling call accepted: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle call accepted",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle call declined event
   */
  async handleCallDeclined(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, conversationId, reason, timestamp } = data;

      if (!callSessionId || !conversationId) {
        this.logger.error("Invalid call declined data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid call declined data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.info(`Call declined: ${callSessionId}, reason: ${reason || 'No reason provided'}`);
      
      // Emit call declined event to other participants (not the sender)
      socket.to(`conversation:${conversationId}`).emit(WEBRTC_EVENTS.CALL_DECLINED, {
        callSessionId,
        conversationId,
        declinedByUserId: socket.userId,
        reason,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling call declined: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle call declined",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle call ended event
   */
  async handleCallEnded(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, conversationId, duration, timestamp } = data;

      if (!callSessionId || !conversationId) {
        this.logger.error("Invalid call ended data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid call ended data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.info(`Call ended: ${callSessionId}, duration: ${duration || 0}s`);
      
      // Emit call ended event to all participants in the conversation
      this.io.to(`conversation:${conversationId}`).emit(WEBRTC_EVENTS.CALL_ENDED, {
        callSessionId,
        conversationId,
        endedByUserId: socket.userId,
        duration,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling call ended: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle call ended",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle WebRTC signaling
   */
  async handleWebRTCSignaling(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, type, data: signalingData, toUserId, timestamp } = data;
      const fromUserId = socket.userId;

      if (!callSessionId || !type || !signalingData || !toUserId) {
        this.logger.error("Invalid WebRTC signaling data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid signaling data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify the socket user is the sender (not recipient)
      if (!fromUserId) {
        this.logger.error(`User not authenticated`);
        return;
      }

      this.logger.info(`WebRTC signaling: ${type} from user ${fromUserId} to user ${toUserId} for call ${callSessionId}`);
      
      // Emit signaling data to the recipient user (not the sender)
      socket.to(`user:${toUserId}`).emit(WEBRTC_EVENTS.WEBRTC_SIGNALING, {
        callSessionId,
        type,
        data: signalingData,
        fromUserId,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling WebRTC signaling: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle signaling",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle call joined event
   */
  async handleCallJoined(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, conversationId, joinedByUserId, isGroupCall, timestamp } = data;

      if (!callSessionId || !conversationId || !joinedByUserId) {
        this.logger.error("Invalid call joined data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid call joined data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.info(`Call joined: ${callSessionId} by user ${joinedByUserId}`);
      
      // Emit call joined event to other participants
      socket.to(`conversation:${conversationId}`).emit(WEBRTC_EVENTS.CALL_JOINED, {
        callSessionId,
        conversationId,
        joinedByUserId,
        isGroupCall,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling call joined: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle call joined",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle call status update
   */
  async handleCallStatusUpdate(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callSessionId, status, userId, timestamp } = data;

      if (!callSessionId || !status || !userId) {
        this.logger.error("Invalid call status update data");
        socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
          error: "Invalid status update data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.info(`Call status update: ${callSessionId} - ${status} by user ${userId}`);
      
      // Emit status update
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        callSessionId,
        status,
        userId,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error handling call status update: ${error?.message || 'Unknown error'}`);
      socket.emit(WEBRTC_EVENTS.CALL_STATUS_UPDATE, {
        error: "Failed to handle status update",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
