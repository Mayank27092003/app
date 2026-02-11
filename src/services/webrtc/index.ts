import { transaction } from "objection";
import {
  CallSession,
  CallParticipant,
  Conversation,
  ConversationParticipant,
  User,
  Message,
} from "../../models";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { emitSystemMessage, getSocketService } from "../socket/instance";
import { notificationService } from "../notification";

export interface InitiateCallData {
  conversationId: number;
  callerId: number;
  callType: "audio" | "video";
  isGroupCall?: boolean;
}

export interface CallSignalingData {
  callSessionId: number;
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "call-ended"
    | "call-accepted"
    | "call-declined";
  data: any;
  fromUserId: number;
  toUserId: number;
}

export interface CallStatusUpdate {
  callSessionId: number;
  status:
    | "initiating"
    | "ringing"
    | "connected"
    | "ended"
    | "declined"
    | "missed"
    | "busy";
  userId: number;
  timestamp: string;
}

export class WebRTCService {
  constructor() {
    // No socket service initialization in constructor
  }

  /**
   * Get socket service instance (import directly when needed)
   */
  private getSocketService(): any {
    try {
      return getSocketService();
    } catch (error) {
      console.warn(
        "Socket service not available, WebRTC events will be limited"
      );
      return null;
    }
  }

  /**
   * Initiate a call in a conversation (supports both 1-on-1 and group calls)
   */
  async initiateCall(data: InitiateCallData): Promise<CallSession> {
    return await transaction(CallSession.knex(), async (trx) => {
      try {
        // Validate conversation exists
        const conversation = await Conversation.query(trx)
          .findById(data.conversationId)
          .withGraphFetched("participants");

        if (!conversation) {
          throw new HttpException("Conversation not found", 404);
        }

        // Get all active participants in the conversation
        const participants = await ConversationParticipant.query(trx)
          .where({ conversationId: data.conversationId })
          .whereNull("leftAt")
          .withGraphFetched("user");

        if (participants.length < 2) {
          throw new HttpException(
            "Conversation must have at least 2 participants",
            400
          );
        }

        // Verify caller is a participant
        const callerParticipant = participants.find(
          (p) => p.userId === data.callerId
        );
        if (!callerParticipant) {
          throw new HttpException(
            "You must be a participant in this conversation",
            403
          );
        }

        // Check if there's already an active call in this conversation
        const activeCall = await CallSession.query(trx)
          .where({ conversationId: data.conversationId })
          .whereIn("status", ["initiating", "ringing", "connected"])
          .first();

        // if (activeCall) {
        //   throw new HttpException(
        //     "There is already an active call in this conversation",
        //     400
        //   );
        // }

        // Determine if this is a group call
        const isGroupCall =
          data.isGroupCall !== undefined
            ? data.isGroupCall
            : participants.length > 2;

        // Create call session
        const callSession = await CallSession.query(trx).insert({
          callerId: data.callerId,
          conversationId: data.conversationId,
          callType: data.callType,
          isGroupCall: isGroupCall,
          status: "initiating",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Add caller as first participant
        await CallParticipant.query(trx).insert({
          callSessionId: callSession.id,
          userId: data.callerId,
          joinedAt: new Date().toISOString(),
          isMuted: false,
          isVideoEnabled: data.callType === "video",
          isScreenSharing: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Insert call initiation message in conversation
        await this.insertCallMessage(
          trx,
          data.conversationId,
          data.callerId,
          "call_initiated",
          {
            callSessionId: callSession.id,
            callType: data.callType,
            isGroupCall: isGroupCall,
            callerId: data.callerId,
            participantCount: participants.length,
          }
        );

        // Notify other participants via socket and push notifications
        const otherParticipants = participants.filter(
          (p) => p.userId !== data.callerId
        );

        otherParticipants.forEach((participant) => {
          const userId = participant.userId;

          // 1. Emit socket event
          this.emitCallEvent(
            "call_incoming",
            {
              callSessionId: callSession.id,
              conversationId: data.conversationId,
              callerId: data.callerId,
              callType: data.callType,
              isGroupCall: isGroupCall,
              participantCount: participants.length,
              timestamp: new Date().toISOString(),
            },
            userId
          );

          // 2. Send push notification
          notificationService.createNotification({
            userId: userId,
            type: "call_incoming",
            title: `Incoming ${data.callType} call`,
            message: `User ${data.callerId} is calling you`,
            entityType: "call_session",
            entityId: callSession.id,
          }).catch(err => {
            Logger.error(`Failed to send call push notification to user ${userId}: ${err.message}`);
          });
        });

        // Update call status to ringing as we've notified recipients
        await CallSession.query(trx).findById(callSession.id).patch({
          status: "ringing",
          updatedAt: new Date().toISOString(),
        });

        Logger.info(`Call ${callSession.id} initiated by user ${data.callerId}`);
        return callSession;
      } catch (error: any) {
        Logger.error(
          `Error initiating call: ${error?.message || "Unknown error"}`
        );
        throw error;
      }
    });
  }

  /**
   * Accept an incoming call (works for both 1-on-1 and group calls)
   */
  async acceptCall(
    callSessionId: number,
    userId: number
  ): Promise<CallSession> {
    return await transaction(CallSession.knex(), async (trx) => {
      try {
        const callSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!callSession) {
          throw new HttpException("Call session not found", 404);
        }

        // Verify user is a participant in the conversation
        const conversationParticipant = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId, userId })
          .whereNull("leftAt")
          .first();

        if (!conversationParticipant) {
          throw new HttpException(
            "You must be a participant in this conversation",
            403
          );
        }

        if (!["ringing", "initiating"].includes(callSession.status)) {
          throw new HttpException(
            "Call is not in a state that can be accepted",
            400
          );
        }

        // Check if user is already a call participant
        const existingParticipant = await CallParticipant.query(trx)
          .where({ callSessionId, userId })
          .first();

        if (existingParticipant) {
          throw new HttpException("You are already in this call", 400);
        }

        // Add user as call participant
        await CallParticipant.query(trx).insert({
          callSessionId: callSessionId,
          userId: userId,
          joinedAt: new Date().toISOString(),
          isMuted: false,
          isVideoEnabled: callSession.callType === "video",
          isScreenSharing: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Get all conversation participants for notification
        const allParticipants = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId })
          .whereNull("leftAt");

        // Insert call accepted message
        await this.insertCallMessage(
          trx,
          callSession.conversationId,
          userId,
          "call_accepted",
          {
            callSessionId: callSessionId,
            callType: callSession.callType,
            isGroupCall: callSession.isGroupCall,
          }
        );

        // Update call status to connected if this is the first acceptance
        if (
          callSession.status === "initiating" ||
          callSession.status === "ringing"
        ) {
          await CallSession.query(trx)
            .findById(callSessionId)
            .patch({
              status: "connected",
              startTime: callSession.startTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
        }

        // Emit call accepted event to all other participants
        const otherParticipants = allParticipants
          .filter((p) => p.userId !== userId)
          .map((p) => p.userId);

        this.emitCallEvent(
          "call_accepted",
          {
            callSessionId: callSessionId,
            conversationId: callSession.conversationId,
            acceptedByUserId: userId,
            isGroupCall: callSession.isGroupCall,
            timestamp: new Date().toISOString(),
          },
          otherParticipants
        );

        Logger.info(`Call accepted: ${callSessionId} by user ${userId}`);
        const updatedCallSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!updatedCallSession) {
          throw new HttpException("Call session not found after update", 404);
        }
        return updatedCallSession;
      } catch (error: any) {
        Logger.error(
          `Error accepting call: ${error?.message || "Unknown error"}`
        );
        throw error;
      }
    });
  }

  /**
   * Decline an incoming call (works for both 1-on-1 and group calls)
   */
  async declineCall(
    callSessionId: number,
    userId: number,
    reason?: string
  ): Promise<CallSession> {
    return await transaction(CallSession.knex(), async (trx) => {
      try {
        const callSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!callSession) {
          throw new HttpException("Call session not found", 404);
        }

        // Verify user is a participant in the conversation
        const conversationParticipant = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId, userId })
          .whereNull("leftAt")
          .first();

        if (!conversationParticipant) {
          throw new HttpException(
            "You must be a participant in this conversation",
            403
          );
        }

        // Get all conversation participants for notification
        const allParticipants = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId })
          .whereNull("leftAt");

        // Insert call declined message
        await this.insertCallMessage(
          trx,
          callSession.conversationId,
          userId,
          "call_declined",
          {
            callSessionId: callSessionId,
            callType: callSession.callType,
            isGroupCall: callSession.isGroupCall,
            reason: reason || "Call declined",
          }
        );

        // For group calls, don't end the call if someone declines
        // For 1-on-1 calls, end the call if declined
        if (!callSession.isGroupCall) {
          await CallSession.query(trx).findById(callSessionId).patch({
            status: "declined",
            endTime: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Emit call declined event to all other participants
        const otherParticipants = allParticipants
          .filter((p) => p.userId !== userId)
          .map((p) => p.userId);

        this.emitCallEvent(
          "call_declined",
          {
            callSessionId: callSessionId,
            conversationId: callSession.conversationId,
            declinedByUserId: userId,
            isGroupCall: callSession.isGroupCall,
            reason: reason,
            timestamp: new Date().toISOString(),
          },
          otherParticipants
        );

        Logger.info(`Call declined: ${callSessionId} by user ${userId}`);
        const updatedCallSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!updatedCallSession) {
          throw new HttpException("Call session not found after update", 404);
        }
        return updatedCallSession;
      } catch (error: any) {
        Logger.error(
          `Error declining call: ${error?.message || "Unknown error"}`
        );
        throw error;
      }
    });
  }

  /**
   * End a call (works for both 1-on-1 and group calls)
   */
  async endCall(callSessionId: number, userId: number): Promise<CallSession> {
    return await transaction(CallSession.knex(), async (trx) => {
      try {
        const callSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!callSession) {
          throw new HttpException("Call session not found", 404);
        }

        // Verify user is a participant in the conversation
        const conversationParticipant = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId, userId })
          .whereNull("leftAt")
          .first();

        if (!conversationParticipant) {
          throw new HttpException(
            "You must be a participant in this conversation",
            403
          );
        }

        const endTime = new Date().toISOString();
        const duration = callSession.startTime
          ? Math.floor(
              (new Date(endTime).getTime() -
                new Date(callSession.startTime).getTime()) /
                1000
            )
          : 0;

        // Update call status
        await CallSession.query(trx).findById(callSessionId).patch({
          status: "ended",
          endTime: endTime,
          duration: duration,
          updatedAt: new Date().toISOString(),
        });

        // Update participant left time
        await CallParticipant.query(trx)
          .where({ callSessionId: callSessionId, userId: userId })
          .patch({
            leftAt: endTime,
            updatedAt: new Date().toISOString(),
          });

        // Insert call ended message
        await this.insertCallMessage(
          trx,
          callSession.conversationId,
          userId,
          "call_ended",
          {
            callSessionId: callSessionId,
            callType: callSession.callType,
            isGroupCall: callSession.isGroupCall,
            duration: duration,
          }
        );

        // Get all conversation participants for notification
        const allParticipants = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId })
          .whereNull("leftAt");

        // Emit call ended event to all participants
        this.emitCallEvent(
          "call_ended",
          {
            callSessionId: callSessionId,
            conversationId: callSession.conversationId,
            endedByUserId: userId,
            isGroupCall: callSession.isGroupCall,
            duration: duration,
            timestamp: endTime,
          },
          allParticipants.map((p) => p.userId)
        );

        Logger.info(`Call ended: ${callSessionId}, duration: ${duration}s`);
        const updatedCallSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!updatedCallSession) {
          throw new HttpException("Call session not found after update", 404);
        }
        return updatedCallSession;
      } catch (error: any) {
        Logger.error(`Error ending call: ${error?.message || "Unknown error"}`);
        throw error;
      }
    });
  }

  /**
   * Join an ongoing group call
   */
  async joinGroupCall(
    callSessionId: number,
    userId: number
  ): Promise<CallSession> {
    return await transaction(CallSession.knex(), async (trx) => {
      try {
        const callSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!callSession) {
          throw new HttpException("Call session not found", 404);
        }

        if (!callSession.isGroupCall) {
          throw new HttpException("This is not a group call", 400);
        }

        if (callSession.status !== "connected") {
          throw new HttpException("Call is not in connected state", 400);
        }

        // Verify user is a participant in the conversation
        const conversationParticipant = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId, userId })
          .whereNull("leftAt")
          .first();

        if (!conversationParticipant) {
          throw new HttpException(
            "You must be a participant in this conversation",
            403
          );
        }

        // Check if user is already in the call
        const existingParticipant = await CallParticipant.query(trx)
          .where({ callSessionId, userId })
          .first();

        if (existingParticipant) {
          throw new HttpException("You are already in this call", 400);
        }

        // Add user as call participant
        await CallParticipant.query(trx).insert({
          callSessionId: callSessionId,
          userId: userId,
          joinedAt: new Date().toISOString(),
          isMuted: false,
          isVideoEnabled: callSession.callType === "video",
          isScreenSharing: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Get all conversation participants for notification
        const allParticipants = await ConversationParticipant.query(trx)
          .where({ conversationId: callSession.conversationId })
          .whereNull("leftAt");

        // Insert call joined message
        await this.insertCallMessage(
          trx,
          callSession.conversationId,
          userId,
          "call_joined",
          {
            callSessionId: callSessionId,
            callType: callSession.callType,
            isGroupCall: callSession.isGroupCall,
          }
        );

        // Emit call joined event to all other participants
        const otherParticipants = allParticipants
          .filter((p) => p.userId !== userId)
          .map((p) => p.userId);

        this.emitCallEvent(
          "call_joined",
          {
            callSessionId: callSessionId,
            conversationId: callSession.conversationId,
            joinedByUserId: userId,
            isGroupCall: callSession.isGroupCall,
            timestamp: new Date().toISOString(),
          },
          otherParticipants
        );

        Logger.info(`User ${userId} joined group call: ${callSessionId}`);
        const updatedCallSession = await CallSession.query(trx).findById(
          callSessionId
        );
        if (!updatedCallSession) {
          throw new HttpException("Call session not found after update", 404);
        }
        return updatedCallSession;
      } catch (error: any) {
        Logger.error(
          `Error joining group call: ${error?.message || "Unknown error"}`
        );
        throw error;
      }
    });
  }

  /**
   * Handle WebRTC signaling (offer, answer, ICE candidates)
   */
  async handleSignaling(data: CallSignalingData): Promise<void> {
    try {
      // Validate call session exists and user is participant
      const callSession = await CallSession.query().findById(
        data.callSessionId
      );
      if (!callSession) {
        throw new HttpException("Call session not found", 404);
      }

      // Check if user is a participant in the call
      const callParticipant = await CallParticipant.query()
        .where({ callSessionId: data.callSessionId, userId: data.fromUserId })
        .first();

      if (!callParticipant) {
        throw new HttpException("Unauthorized to send signaling data", 403);
      }

      // Emit signaling data to the other participant
      this.emitCallEvent(
        "webrtc_signaling",
        {
          callSessionId: data.callSessionId,
          type: data.type,
          data: data.data,
          fromUserId: data.fromUserId,
          timestamp: new Date().toISOString(),
        },
        data.toUserId
      );

      Logger.info(
        `WebRTC signaling: ${data.type} for call ${data.callSessionId}`
      );
    } catch (error: any) {
      Logger.error(
        `Error handling signaling: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get call history for a conversation
   */
  async getCallHistory(
    conversationId: number,
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    calls: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCalls: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      // Verify user is participant in conversation
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .whereNull("leftAt")
        .first();

      if (!participant) {
        throw new HttpException("Access denied to conversation", 403);
      }

      const offset = (page - 1) * limit;

      const calls = await CallSession.query()
        .where({ conversationId })
        .withGraphFetched("[caller, participants.user]")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset);

      const totalCalls = await CallSession.query()
        .where({ conversationId })
        .resultSize();

      const totalPages = Math.ceil(totalCalls / limit);

      return {
        calls,
        pagination: {
          currentPage: page,
          totalPages,
          totalCalls,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error: any) {
      Logger.error(
        `Error getting call history: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Insert call-related message in conversation
   */
  private async insertCallMessage(
    trx: any,
    conversationId: number,
    userId: number,
    messageType: string,
    metadata: any
  ): Promise<void> {
    try {
      const messageContent = this.generateCallMessage(messageType, metadata);

      await Message.query(trx).insert({
        conversationId: conversationId,
        senderUserId: userId,
        content: messageContent,
        isSystem: true,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update conversation last message time
      await Conversation.query(trx).findById(conversationId).patch({
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(
        `Error inserting call message: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Generate call message content
   */
  private generateCallMessage(messageType: string, metadata: any): string {
    switch (messageType) {
      case "call_initiated":
        const callType = metadata.callType === "video" ? "Video" : "Audio";
        const callScope = metadata.isGroupCall ? "group" : "call";
        return `📞 ${callType} ${callScope} started${
          metadata.participantCount
            ? ` (${metadata.participantCount} participants)`
            : ""
        }`;
      case "call_accepted":
        return `✅ Call accepted`;
      case "call_declined":
        return `❌ Call declined${
          metadata.reason ? `: ${metadata.reason}` : ""
        }`;
      case "call_ended":
        return `📞 Call ended (${this.formatDuration(metadata.duration)})`;
      case "call_joined":
        return `👥 Joined the call`;
      default:
        return `📞 Call event: ${messageType}`;
    }
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Emit call event to specific user(s)
   */
  private emitCallEvent(
    event: string,
    data: any,
    userIds: number | number[]
  ): void {
    const socketService = this.getSocketService();
    if (!socketService) {
      console.warn(`Socket service not available, cannot emit ${event} event`);
      return;
    }

    const userIdsArray = Array.isArray(userIds) ? userIds : [userIds];

    userIdsArray.forEach((userId) => {
      socketService.getSocketInstance().to(`user:${userId}`).emit(event, data);
    });
  }
}
