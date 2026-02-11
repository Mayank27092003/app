import { transaction } from "objection";
import { Conversation, Message, ConversationParticipant, User, Company, Driver, MessageStatus, UserFcmToken } from "../../models";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { emitSystemMessage, getSocketService } from "../socket/instance";
import { firebaseService } from "../notification/firebase.service";

export interface CreateConversationData {
  chatType: "direct" | "group";
  title?: string;
  jobId?: number;
  participantUserIds: number[];
  createdByUserId: number;
}

export interface SendMessageData {
  conversationId: number;
  senderUserId?: number;
  content?: string; // 👈 now optional - required only for text/system messages
  messageType: "text" | "file" | "image" | "system";
  fileType?: string; // 👈 new field for specific file type (pdf, doc, audio, video, etc.)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToMessageId?: number; // 👈 new field for reply functionality
}

export interface GetOrCreateDirectConversationInput {
  currentUserId: number;
  receiverUserId: number;
}

export interface ConversationWithParticipants {
  id: number;
  chatType: string;
  title?: string;
  jobId?: number;
  lastMessageAt?: string;
  createdAt?: string;
  participants: Array<{
    id: number;
    userId: number;
    role: string;
    joinedAt: string;
    leftAt?: string;
    archivedAt?: string;
    isArchived: boolean;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      companyId?: number;
      company?: {
        id: number;
        name: string;
      };
    };
  }>;
  lastMessage?: {
    id: number;
    content: string;
    messageType: any;
    senderUserId?: number;
    sentAt?: string;
  };
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      // Validate participants exist
      const participants = await User.query().whereIn("id", data.participantUserIds);
      if (participants.length !== data.participantUserIds.length) {
        throw new HttpException("Some participants not found", 400);
      }

      // Create conversation
      const conversation = await Conversation.query().insert({
        jobId: data.jobId,
        chatType: data.chatType,
        title: data.title || this.generateConversationTitle(data.chatType, data.jobId),
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add participants
      const participantRecords = data.participantUserIds.map(userId => ({
        conversationId: conversation.id,
        userId,
        joinedAt: new Date().toISOString(),
      }));

      await ConversationParticipant.query().insert(participantRecords);

      // Add system message for group/job conversations
      if (data.chatType === "group") {
        await this.sendSystemMessage(conversation.id, `Conversation created by ${participants.find(p => p.id === data.createdByUserId)?.firstName || 'User'}`);
      }

      Logger.info(`Conversation created: ${conversation.id} with ${data.participantUserIds.length} participants`);
      return conversation;
          } catch (error: any) {
        Logger.error(`Error creating conversation: ${error?.message || 'Unknown error'}`);
        throw error;
      }
  }

  /**
   * Get or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(input: GetOrCreateDirectConversationInput): Promise<Conversation> {
    const { currentUserId, receiverUserId } = input;
    if (currentUserId === receiverUserId) {
      throw new HttpException("Cannot create conversation with yourself", 400);
    }

    // Look for existing direct conversation including both users
    const existing = await Conversation.query()
      .where({ chatType: "direct" })
      .join("conversationParticipants as cp1", "cp1.conversationId", "conversations.id")
      .join("conversationParticipants as cp2", "cp2.conversationId", "conversations.id")
      .where("cp1.userId", currentUserId)
      .where("cp2.userId", receiverUserId)
      .select("conversations.*")
      .first();

    if (existing) {
      // Ensure both participants are active (clear archived/left flags for requester)
      await ConversationParticipant.query()
        .patch({ archivedAt: null, leftAt: null })
        .where({ conversationId: existing.id, userId: currentUserId });
      return existing as Conversation;
    }

    // Create a new direct conversation
    const nowIso = new Date().toISOString();
    const conversation = await Conversation.query().insertAndFetch({
      chatType: "direct",
      title: "Direct Message",
      lastMessageAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Add both participants
    await ConversationParticipant.query().insert([
      { conversationId: conversation.id, userId: currentUserId, joinedAt: nowIso },
      { conversationId: conversation.id, userId: receiverUserId, joinedAt: nowIso },
    ]);

    return conversation;
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: number,
    archivedMode: "exclude" | "include" | "only" = "exclude"
  ): Promise<ConversationWithParticipants[]> {
    try {
      const conversations: any = await Conversation.query()
        .withGraphFetched({
          participants: {
            user: {
              company: true
            }
          },
          lastMessage: true
        })
        .modify((queryBuilder) => {
          queryBuilder
            .join("conversationParticipants", "conversations.id", "conversationParticipants.conversationId")
            .where("conversationParticipants.userId", userId);

          if (archivedMode === "exclude") {
            queryBuilder.whereNull("conversationParticipants.archivedAt");
          } else if (archivedMode === "only") {
            queryBuilder.whereNotNull("conversationParticipants.archivedAt");
          }
        })
        .orderBy("lastMessageAt", "desc");

      const typedConversations = conversations as Array<Conversation & { lastMessage?: Message; participants?: any[] }>;

      return typedConversations.map((conv: Conversation & { lastMessage?: Message; participants?: any[] }) => ({
        id: conv.id,
        chatType: conv.chatType,
        title: conv.title,
        jobId: conv.jobId,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        participants: (conv.participants || []),
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage.id,
              content: conv.lastMessage.content,
              messageType: conv.lastMessage.messageType,
              senderUserId: conv.lastMessage.senderUserId,
              sentAt: conv.lastMessage.sentAt,
            }
          : undefined,
      }));
    } catch (error: any) {
      Logger.error(`Error getting user conversations: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get conversation details (without messages)
   */
  async getConversationDetails(conversationId: number, userId: number): Promise<any> {
    try {
      // Check if user has access to conversation
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();
      if (!participant) {
        throw new HttpException("Access denied to conversation", 403);
      }

      const conversation = await Conversation.query()
        .findById(conversationId)
        .withGraphFetched({
          participants: {
            user: {
              company: true
            }
          }
        });

      if (!conversation) {
        throw new HttpException("Conversation not found", 404);
      }

      return conversation;
    } catch (error: any) {
      Logger.error(`Error getting conversation details: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get message history with pagination and message status (returns raw data for performance)
   */
  async getMessageHistory(
    conversationId: number, 
    userId: number, 
    page: number = 1, 
    limit: number = 50,
    startDate?: string,
    endDate?: string,
    searchText?: string
  ): Promise<{
    messages: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    filters: {
      startDate?: string;
      endDate?: string;
      searchText?: string;
      userJoinedAt?: string;
      userLeftAt?: string;
    };
  }> {
    try {
      // Check if user has access to conversation
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();
      if (!participant) {
        throw new HttpException("Access denied to conversation", 403);
      }

      const offset = (page - 1) * limit;
      const userJoinedAt = (participant as any).joinedAt;
      const userLeftAt = (participant as any).leftAt;

      // Build query conditions
      let messageQuery = Message.query().where({ conversationId });

      // Note: Removed user participation window filter to allow users to see all messages
      // and who viewed them, regardless of when they joined/left

      // Apply custom time range filters
      if (startDate) {
        messageQuery = messageQuery.where('sentAt', '>=', startDate);
      }
      if (endDate) {
        messageQuery = messageQuery.where('sentAt', '<=', endDate);
      }

      // Apply search text filter
      if (searchText && searchText.trim()) {
        messageQuery = messageQuery.where('content', 'ilike', `%${searchText.trim()}%`);
      }

      // Get total count with filters applied
      const totalMessages = await messageQuery.clone().resultSize();

      // Get messages with all relations (raw data for performance)
      const messages = await messageQuery
        .withGraphFetched({
          sender: true,
          replyToMessage: {
            sender: true
          }
        })
        .orderBy('sentAt', 'desc')
        .limit(limit)
        .offset(offset);

      // Get ALL message statuses for these messages (not just for current user)
      // This allows users to see who viewed each message
      const messageIds = messages.map((msg: any) => msg.id);
      let allMessageStatusMap: { [key: number]: any[] } = {};
      
      if (messageIds.length > 0) {
        try {
          // Get ALL message statuses for these messages with user details
          const allMessageStatuses = await MessageStatus.query()
            .whereIn('messageId', messageIds)
            .withGraphFetched('user')
            .orderBy('createdAt', 'asc');

          // Group by messageId
          allMessageStatusMap = allMessageStatuses.reduce((acc: any, status: any) => {
            if (!acc[status.messageId]) {
              acc[status.messageId] = [];
            }
            acc[status.messageId].push(status);
            return acc;
          }, {});

          // Find messages without status entries for current user and create them
          const messagesWithoutUserStatus = messageIds.filter(msgId => 
            !allMessageStatusMap[msgId]?.some((status: any) => status.userId === userId)
          );
          
          if (messagesWithoutUserStatus.length > 0) {
            const now = new Date().toISOString();
            const statusEntries = messagesWithoutUserStatus.map(msgId => ({
              messageId: msgId,
              userId: userId,
              isRead: false,
              isDelivered: true, // Assume delivered if user is accessing the conversation
              deliveredAt: now,
              createdAt: now,
              updatedAt: now
            }));

            // Insert missing status entries
            await MessageStatus.query().insert(statusEntries);
            
            // Update the map with the new entries
            messagesWithoutUserStatus.forEach(msgId => {
              if (!allMessageStatusMap[msgId]) {
                allMessageStatusMap[msgId] = [];
              }
              allMessageStatusMap[msgId].push({
                messageId: msgId,
                userId: userId,
                isRead: false,
                isDelivered: true,
                deliveredAt: now,
                createdAt: now,
                updatedAt: now,
                user: null // Will be populated by the user relation if needed
              });
            });

            Logger.info(`Created ${messagesWithoutUserStatus.length} missing message status entries for user ${userId}`);
          }
        } catch (statusError: any) {
          Logger.warn(`Error loading message status: ${statusError?.message || 'Unknown error'}`);
          // Continue without message status if there's an error
        }
      }

      // Attach ALL message statuses to each message (so users can see who viewed them)
      messages.forEach((message: any) => {
        message.messageStatus = allMessageStatusMap[message.id] || [];
      });

      const totalPages = Math.ceil(totalMessages / limit);

      // Mark messages as read for this user if they are currently active (not left)
      if (!(participant as any).leftAt) {
        await this.markMessagesAsRead(conversationId, userId);
      }

      // Return raw data without mapping for better performance
      return {
        messages: messages as any[],
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          startDate,
          endDate,
          searchText,
          userJoinedAt,
          userLeftAt,
        },
      };
    } catch (error: any) {
      Logger.error(`Error getting message history: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }


  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    return await transaction(Message.knex(), async (trx) => {
      try {
        // Check if user is an active participant and role allows sending
        const participant = await ConversationParticipant.query(trx)
          .where({ conversationId: data.conversationId, userId: data.senderUserId })
          .first();
        if (!participant) {
          throw new HttpException("Access denied to conversation", 403);
        }
        if ((participant as any).leftAt) {
          throw new HttpException("You are no longer a participant in this conversation", 403);
        }
        const role = (participant as any).role || "member";
        if (role === "viewer") {
          throw new HttpException("You need to accept the invite to send messages", 403);
        }

        // Validate reply message if provided
        if (data.replyToMessageId) {
          const replyToMessage = await Message.query(trx)
            .where({ id: data.replyToMessageId, conversationId: data.conversationId })
            .first();
          if (!replyToMessage) {
            throw new HttpException("Reply message not found in this conversation", 400);
          }
        }

        // Create message
        const message = await Message.query(trx).insert({
          conversationId: data.conversationId,
          senderUserId: data.senderUserId,
          content: data.content || "", // 👈 handle optional content
          messageType: data.messageType,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyToMessageId: data.replyToMessageId || null,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update conversation last message time
        await Conversation.query(trx)
          .patchAndFetchById(data.conversationId, {
            lastMessageAt: new Date().toISOString(),
            lastMessageId: message.id,
            updatedAt: new Date().toISOString(),
          });

        // Get all participants to create message status
        const participants = await ConversationParticipant.query(trx)
          .where({ conversationId: data.conversationId })
          .whereNull("leftAt");

        // Check which users are online for immediate delivery confirmation
        const socketService = getSocketService();
        const onlineUserIds = new Set<number>();
        if (socketService) {
          participants.forEach(participant => {
            if (socketService.isUserOnline(participant.userId)) {
              onlineUserIds.add(participant.userId);
            }
          });
        }

        // Create message status in background for better performance
        this.createMessageStatusInBackground(message.id, participants, onlineUserIds, data.senderUserId!);

        // Emit message to participants' personal rooms (more efficient and reliable)
        if (socketService) {
          const messageData = {
            id: message.id,
            conversationId: message.conversationId,
            senderUserId: message.senderUserId,
            content: message.content,
            messageType: message.messageType,
            fileType: message.fileType,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            replyToMessageId: message.replyToMessageId,
            sentAt: message.sentAt,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          };

          // Emit to sender's personal room first
          socketService.getSocketInstance().to(`user:${data.senderUserId}`).emit("new_message", {
            ...messageData,
            timestamp: new Date(),
          });

          // Emit to each participant's personal room (excluding sender)
          participants.forEach((participant) => {
            if (participant.userId !== data.senderUserId) {
              socketService.getSocketInstance().to(`user:${participant.userId}`).emit("new_message", {
                ...messageData,
                timestamp: new Date(),
              });

              // Send delivery confirmation for online users (already marked as delivered in status)
              const isOnline = onlineUserIds.has(participant.userId);
              if (isOnline) {
                socketService.getSocketInstance().to(`user:${data.senderUserId}`).emit("message_delivered", {
                  messageId: message.id,
                  conversationId: message.conversationId,
                  deliveredToUserId: participant.userId,
                  deliveredAt: new Date().toISOString(),
                  timestamp: new Date(),
                });
              }

              // Always send push notification (frontend will handle visibility based on app state)
              if (data.senderUserId && data.messageType !== "system") {
                this.sendMessageNotificationAsync(
                  participant.userId,
                  data.senderUserId,
                  message.conversationId,
                  message.messageType,
                  message.content || "",
                  message.fileType,
                  message.fileName
                ).catch((notifError: any) => {
                  Logger.error(`Failed to send message notification: ${notifError?.message || "Unknown error"}`);
                });
              }
            }
          });
        }

        Logger.info(`Message sent in conversation ${data.conversationId} by user ${data.senderUserId}`);
        return message;
      } catch (error: any) {
        Logger.error(`Error sending message: ${error?.message || 'Unknown error'}`);
        throw error;
      }
    });
  }

  /**
   * Send system message
   */
  async sendSystemMessage(conversationId: number, content: string): Promise<Message> {
    try {
      const message = await Message.query().insert({
        conversationId: conversationId,
        senderUserId: 0, // System user
        content,
        messageType: "system",
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update conversation last message time
      await Conversation.query()
        .patchAndFetchById(conversationId, {
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      Logger.info(`System message sent in conversation ${conversationId}`);
      return message;
          } catch (error: any) {
        Logger.error(`Error sending system message: ${error?.message || 'Unknown error'}`);
        throw error;
      }
  }


  /**
   * Create message status entries in background for better performance
   */
  private createMessageStatusInBackground(
    messageId: number, 
    participants: any[], 
    onlineUserIds: Set<number>, 
    senderUserId: number
  ): void {
    // Use setImmediate to run in next tick of event loop
    setImmediate(async () => {
      try {
        const now = new Date().toISOString();
        const messageStatusRecords = participants.map(participant => {
          const isOnline = onlineUserIds.has(participant.userId);
          return {
            messageId: messageId,
            userId: participant.userId,
            isRead: participant.userId === senderUserId, // Sender has read their own message
            isDelivered: isOnline || participant.userId === senderUserId, // Delivered if online or sender
            deliveredAt: isOnline || participant.userId === senderUserId ? now : null,
            readAt: participant.userId === senderUserId ? now : null,
            createdAt: now,
            updatedAt: now,
          };
        });

        // Use upsert to handle potential race conditions
        await MessageStatus.query().insert(messageStatusRecords);
        Logger.info(`Created ${messageStatusRecords.length} message status entries in background for message ${messageId}`);
      } catch (error: any) {
        Logger.error(`Error creating message status in background: ${error?.message || 'Unknown error'}`);
      }
    });
  }

  /**
   * Confirm delivery of pending messages for a user (when they come online)
   */
  async confirmPendingDeliveries(userId: number): Promise<void> {
    try {
      // Get all undelivered messages for this user
      const undeliveredMessages = await Message.query()
        .join("messageStatus", "messages.id", "messageStatus.messageId")
        .where("messageStatus.userId", userId)
        .where("messageStatus.isDelivered", false)
        .where("messages.senderUserId", "!=", userId)
        .select("messages.id as messageId", "messages.senderUserId", "messages.conversationId");

      if (undeliveredMessages.length > 0) {
        // Update all undelivered messages to delivered
        await MessageStatus.query()
          .whereIn("messageId", undeliveredMessages.map(m => m.id))
          .where("userId", userId)
          .patch({
            isDelivered: true,
            deliveredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        // Emit delivery confirmations to senders
        const socketService = getSocketService();
        if (socketService) {
          undeliveredMessages.forEach((msg) => {
            socketService.getSocketInstance().to(`user:${msg.senderUserId}`).emit("message_delivered", {
              messageId: msg.id,
              conversationId: msg.conversationId,
              deliveredToUserId: userId,
              deliveredAt: new Date().toISOString(),
              timestamp: new Date(),
            });
          });
        }

        Logger.info(`Confirmed delivery of ${undeliveredMessages.length} pending messages for user ${userId}`);
      }
    } catch (error: any) {
      Logger.error(`Error confirming pending deliveries: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Mark message as received (for manual confirmation if needed)
   */
  async markMessageAsReceived(messageId: number, userId: number): Promise<void> {
    try {
      // Update message status to delivered for this user
      await MessageStatus.query()
        .where({ messageId, userId })
        .patch({
          isDelivered: true,
          deliveredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      // Get message details for notification
      const message = await Message.query()
        .findById(messageId)
        .withGraphFetched("sender");

      if (message && message.senderUserId !== userId) {
        // Emit delivery confirmation to sender
        const socketService = getSocketService();
        if (socketService) {
          socketService.getSocketInstance().to(`user:${message.senderUserId}`).emit("message_delivered", {
            messageId,
            conversationId: message.conversationId,
            deliveredToUserId: userId,
            deliveredAt: new Date().toISOString(),
            timestamp: new Date(),
          });
        }
      }

      Logger.info(`Message ${messageId} marked as received by user ${userId}`);
    } catch (error: any) {
      Logger.error(`Error marking message as received: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    return await transaction(Message.knex(), async (trx) => {
      try {
        // Get all unread messages for this user in this conversation
        const unreadMessages = await Message.query(trx)
          .join("messageStatus", "messages.id", "messageStatus.messageId")
          .where("messages.conversationId", conversationId)
          .where("messageStatus.userId", userId)
          .where("messageStatus.isRead", false)
          .where("messages.senderUserId", "!=", userId)
          .select("messages.id as messageId") as unknown as Array<{ messageId: number }>;

        if (unreadMessages.length > 0) {
          // Update message status to read
          await MessageStatus.query(trx)
            .whereIn("messageId", unreadMessages.map(m => m.messageId))
            .where("userId", userId)
            .patch({
              isRead: true,
              readAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

          // Get all participants to emit read status update
          const participants = await ConversationParticipant.query(trx)
            .where({ conversationId })
            .whereNull("leftAt");

          // Emit read status to all participants' personal rooms
          const socketService = getSocketService();
          if (socketService && participants.length > 0) {
            const readStatusData = {
              conversationId,
              readByUserId: userId,
              readAt: new Date().toISOString(),
              messageIds: unreadMessages.map(m => m.messageId),
              timestamp: new Date(),
            };

            // Emit to each participant's personal room
            participants.forEach((participant) => {
              socketService.getSocketInstance().to(`user:${participant.userId}`).emit("messages_read", readStatusData);
            });

            // Also emit to conversation room for real-time updates
            socketService.getSocketInstance().to(`conversation:${conversationId}`).emit("messages_read", readStatusData);
          }
        }

        Logger.info(`Messages marked as read in conversation ${conversationId} by user ${userId}`);
      } catch (error: any) {
        Logger.error(`Error marking messages as read: ${error?.message || 'Unknown error'}`);
        throw error;
      }
    });
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(conversationId: number, userId: number): Promise<void> {
    try {
      const existingParticipant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();

      if (existingParticipant) {
        // If previously left, re-activate participation
        await ConversationParticipant.query()
          .patch({ leftAt: null, archivedAt: null })
          .where({ id: (existingParticipant as any).id });
        return;
      }

      await ConversationParticipant.query().insert({
        conversationId,
        userId,
        joinedAt: new Date().toISOString(),
      });

      // Send system message
      await this.sendSystemMessage(conversationId, `New participant added to conversation`);

      Logger.info(`User ${userId} added to conversation ${conversationId}`);
          } catch (error: any) {
        Logger.error(`Error adding participant: ${error?.message || 'Unknown error'}`);
        throw error;
      }
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: number, userId: number): Promise<void> {
    try {
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();
      if (!participant) return;

      await ConversationParticipant.query()
        .patch({ leftAt: new Date().toISOString() })
        .where({ id: (participant as any).id });

      // Send system message
      await this.sendSystemMessage(conversationId, `Participant removed from conversation`);

      Logger.info(`User ${userId} removed from conversation ${conversationId}`);
          } catch (error: any) {
        Logger.error(`Error removing participant: ${error?.message || 'Unknown error'}`);
        throw error;
      }
  }

  /**
   * Toggle archive conversation
   */
  async toggleArchiveConversation(conversationId: number, userId: number): Promise<{ isArchived: boolean }> {
    try {
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();
      if (!participant) {
        throw new HttpException("Access denied to conversation", 403);
      }

      const isCurrentlyArchived = !!(participant as any).archivedAt;
      const newArchivedAt = isCurrentlyArchived ? null : new Date().toISOString();

      await ConversationParticipant.query()
        .patch({ archivedAt: newArchivedAt })
        .where({ id: (participant as any).id });

      const isArchived = !isCurrentlyArchived;
      Logger.info(`Conversation ${conversationId} ${isArchived ? 'archived' : 'unarchived'} by user ${userId}`);
      
      return { isArchived };
    } catch (error: any) {
      Logger.error(`Error toggling archive conversation: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Archive conversation (legacy method for backward compatibility)
   */
  async archiveConversation(conversationId: number, userId: number): Promise<void> {
    try {
      const result = await this.toggleArchiveConversation(conversationId, userId);
      if (!result.isArchived) {
        // If it wasn't archived, archive it now
        await this.toggleArchiveConversation(conversationId, userId);
      }
    } catch (error: any) {
      Logger.error(`Error archiving conversation: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Check if user has access to conversation
   */
  private async checkConversationAccess(conversationId: number, userId: number): Promise<boolean> {
    try {
      const participant = await ConversationParticipant.query()
        .where({ conversationId, userId })
        .first();
      
      return !!participant;
    } catch (error: any) {
      Logger.error(`Error checking conversation access: ${error?.message || 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Generate conversation title
   */
  private generateConversationTitle(chatType: string, jobId?: number): string {
    if (chatType === "job" && jobId) {
      return `Job ${jobId} Discussion`;
    }
    if (chatType === "group") {
      return `Group Chat`;
    }
    return "Direct Message";
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const result = await MessageStatus.query()
        .join("messages", "messageStatus.messageId", "messages.id")
        .join("conversationParticipants", "messages.conversationId", "conversationParticipants.conversationId")
        .where("messageStatus.userId", userId)
        .where("messageStatus.isRead", false)
        .where("messages.senderUserId", "!=", userId)
        .whereNull("conversationParticipants.archivedAt")
        .whereNull("conversationParticipants.leftAt")
        .count("messageStatus.id as count")
        .first() as unknown as { count?: string };

      return parseInt(result?.count ?? "0");
    } catch (error: any) {
      Logger.error(`Error getting unread message count: ${error?.message || 'Unknown error'}`);
      return 0;
    }
  }

  /**
   * Get message read status for a conversation
   */
  async getMessageReadStatus(conversationId: number, userId: number): Promise<{
    unreadCount: number;
    lastReadAt?: string;
    messages: Array<{
      id: number;
      isRead: boolean;
      readAt?: string;
      senderUserId?: number;
      replyToMessageId?: number;
    }>;
  }> {
    try {
      // Get unread count for this user
      const unreadCount = await MessageStatus.query()
        .join("messages", "messageStatus.messageId", "messages.id")
        .where("messages.conversationId", conversationId)
        .where("messageStatus.userId", userId)
        .where("messageStatus.isRead", false)
        .where("messages.senderUserId", "!=", userId)
        .count("messageStatus.id as count")
        .first() as unknown as { count?: string };

      // Get last read timestamp
      const lastReadMessage = await MessageStatus.query()
        .join("messages", "messageStatus.messageId", "messages.id")
        .where("messages.conversationId", conversationId)
        .where("messageStatus.userId", userId)
        .where("messageStatus.isRead", true)
        .where("messages.senderUserId", "!=", userId)
        .orderBy("messageStatus.readAt", "desc")
        .first();

      // Get all messages with read status
      const messages = await Message.query()
        .leftJoin("messageStatus", function() {
          this.on("messages.id", "=", "messageStatus.messageId")
            .andOn("messageStatus.userId", "=", String(userId));
        })
        .where("messages.conversationId", conversationId)
        .select(
          "messages.id",
          "messages.senderUserId", 
          "messages.replyToMessageId",
          "messageStatus.isRead",
          "messageStatus.readAt"
        )
        .orderBy("messages.sentAt", "asc") as Array<{
          id: number;
          senderUserId?: number;
          replyToMessageId?: number | null;
          isRead?: boolean;
          readAt?: string | null;
        }>;

      return {
        unreadCount: parseInt(unreadCount?.count ?? "0"),
        lastReadAt: lastReadMessage?.readAt || undefined,
        messages: messages.map(msg => ({
          id: msg.id,
          isRead: msg.isRead || false,
          readAt: msg.readAt || undefined,
          senderUserId: msg.senderUserId,
          replyToMessageId: msg.replyToMessageId || undefined,
        })),
      };
    } catch (error: any) {
      Logger.error(`Error getting message read status: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Search conversations by message content
   */
  async searchConversations(userId: number, query: string): Promise<ConversationWithParticipants[]> {
    try {
      const conversations :any= await Conversation.query()
        .withGraphFetched({
          participants: {
            user: {
              company: true
            }
          },
          lastMessage: true
        })
        .modify((queryBuilder) => {
          queryBuilder
            .join("conversationParticipants", "conversations.id", "conversationParticipants.conversationId")
            .join("messages", "conversations.id", "messages.conversationId")
            .where("conversationParticipants.userId", userId)
            .whereNull("conversationParticipants.archivedAt")
            .where((qb) => {
              qb.whereNull("conversationParticipants.leftAt")
                .orWhereRaw("messages.\"sentAt\" < conversationParticipants.\"leftAt\"");
            })
            .where("messages.content", "ilike", `%${query}%`)
            .andWhereRaw("messages.\"sentAt\" >= COALESCE(conversationParticipants.\"joinedAt\", messages.\"sentAt\")");
        })
        .distinct("conversations.id")
        .orderBy("conversations.lastMessageAt", "desc");

      return conversations.map((conv: Conversation & { lastMessage?: Message; participants?: any[] }) => ({
        id: conv.id,
        chatType: conv.chatType,
        title: conv.title,
        jobId: conv.jobId,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        participants: (conv.participants || []).map((participant: any) => ({
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          joinedAt: participant.joinedAt,
          leftAt: participant.leftAt,
          archivedAt: participant.archivedAt,
          isArchived: !!participant.archivedAt,
          user: {
            id: participant.user?.id,
            firstName: participant.user?.firstName,
            lastName: participant.user?.lastName,
            email: participant.user?.email,
            companyId: participant.user?.companyId,
            company: participant.user?.company ? {
              id: participant.user.company.id,
              name: participant.user.company.name,
            } : undefined,
          },
        })),
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage.id,
          content: conv.lastMessage.content,
          messageType: conv.lastMessage.messageType,
          senderUserId: conv.lastMessage.senderUserId,
          sentAt: conv.lastMessage.sentAt,
        } : undefined,
      }));
    } catch (error: any) {
      Logger.error(`Error searching conversations: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Update a message (only sender can edit)
   */
  async updateMessage(messageId: number, userId: number, updateData: {
    content?: string;
    messageType?: "text" | "file" | "image" | "system";
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }): Promise<any> {
    return await transaction(Message.knex(), async (trx) => {
      try {
        // Check if message exists and user is the sender
        const message = await Message.query(trx)
          .where({ id: messageId })
          .where({ senderUserId: userId })
          .where({ isDeleted: false })
          .first();

        if (!message) {
          throw new Error("Message not found or you don't have permission to edit it");
        }

        // Prepare update data
        const updateFields: any = {
          isEdited: true,
          editedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Only update fields that are provided
        if (updateData.content !== undefined) {
          updateFields.content = updateData.content;
        }
        if (updateData.messageType !== undefined) {
          updateFields.messageType = updateData.messageType;
        }
        if (updateData.fileType !== undefined) {
          updateFields.fileType = updateData.fileType;
        }
        if (updateData.fileUrl !== undefined) {
          updateFields.fileUrl = updateData.fileUrl;
        }
        if (updateData.fileName !== undefined) {
          updateFields.fileName = updateData.fileName;
        }
        if (updateData.fileSize !== undefined) {
          updateFields.fileSize = updateData.fileSize;
        }

        // Update the message
        const updatedMessage = await Message.query(trx)
          .patchAndFetchById(messageId, updateFields);

        // Get conversation participants for socket emission
        const participants = await ConversationParticipant.query(trx)
          .where({ conversationId: message.conversationId })
          .whereNull("leftAt");

        // Emit message update to all participants
        const socketService = getSocketService();
        if (socketService && participants.length > 0) {
          const updateData = {
            messageId: updatedMessage.id,
            conversationId: updatedMessage.conversationId,
            content: updatedMessage.content,
            messageType: updatedMessage.messageType,
            fileType: updatedMessage.fileType,
            fileUrl: updatedMessage.fileUrl,
            fileName: updatedMessage.fileName,
            fileSize: updatedMessage.fileSize,
            isEdited: updatedMessage.isEdited,
            editedAt: updatedMessage.editedAt,
            timestamp: new Date(),
          };

          // 1. Emit to sender's personal room first
          socketService.getSocketInstance().to(`user:${userId}`).emit("message_updated", updateData);

          // 2. Emit to each participant's personal room (excluding sender)
          participants.forEach((participant) => {
            if (participant.userId !== userId) {
              socketService.getSocketInstance().to(`user:${participant.userId}`).emit("message_updated", updateData);
            }
          });

          // 3. Also emit to conversation room for real-time updates
          socketService.getSocketInstance().to(`conversation:${message.conversationId}`).emit("message_updated", updateData);
        }

        Logger.info(`Message ${messageId} updated by user ${userId}`);
        return updatedMessage;
      } catch (error: any) {
        Logger.error(`Error updating message: ${error?.message || 'Unknown error'}`);
        throw error;
      }
    });
  }

  /**
   * Delete a message (only sender can delete)
   */
  async deleteMessage(messageId: number, userId: number): Promise<void> {
    return await transaction(Message.knex(), async (trx) => {
      try {
        // Check if message exists and user is the sender
        const message = await Message.query(trx)
          .where({ id: messageId })
          .where({ senderUserId: userId })
          .where({ isDeleted: false })
          .first();

        if (!message) {
          throw new Error("Message not found or you don't have permission to delete it");
        }

        // Mark message as deleted (soft delete)
        await Message.query(trx)
          .patchAndFetchById(messageId, {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        // Get conversation participants for socket emission
        const participants = await ConversationParticipant.query(trx)
          .where({ conversationId: message.conversationId })
          .whereNull("leftAt");

        // Emit message delete to all participants
        const socketService = getSocketService();
        if (socketService && participants.length > 0) {
          const deleteData = {
            messageId: messageId,
            conversationId: message.conversationId,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            timestamp: new Date(),
          };

          // 1. Emit to sender's personal room first
          socketService.getSocketInstance().to(`user:${userId}`).emit("message_deleted", deleteData);

          // 2. Emit to each participant's personal room (excluding sender)
          participants.forEach((participant) => {
            if (participant.userId !== userId) {
              socketService.getSocketInstance().to(`user:${participant.userId}`).emit("message_deleted", deleteData);
            }
          });

          // 3. Also emit to conversation room for real-time updates
          socketService.getSocketInstance().to(`conversation:${message.conversationId}`).emit("message_deleted", deleteData);
        }

        Logger.info(`Message ${messageId} deleted by user ${userId}`);
      } catch (error: any) {
        Logger.error(`Error deleting message: ${error?.message || 'Unknown error'}`);
        throw error;
      }
    });
  }

  /**
   * Send message push notification asynchronously (no database save)
   */
  private async sendMessageNotificationAsync(
    recipientUserId: number,
    senderUserId: number,
    conversationId: number,
    messageType: string,
    messageContent: string,
    fileType?: string | null,
    fileName?: string | null
  ): Promise<void> {
    try {
      // Get sender info
      const sender = await User.query().findById(senderUserId);
      if (!sender) return;

      const senderName = sender.userName || sender.fullName || sender.firstName || "Someone";
      
      // Determine notification body based on message type
      let notificationBody: string;
      
      if (messageType === "text") {
        // Text message - show preview
        notificationBody = messageContent.length > 100 
          ? messageContent.substring(0, 100) + "..." 
          : messageContent || "New message";
      } else if (messageType === "image") {
        notificationBody = "sent an image";
      } else if (messageType === "file") {
        // Handle different file types
        if (fileType) {
          const fileTypeLower = fileType.toLowerCase();
          if (fileTypeLower.includes("pdf")) {
            notificationBody = fileName ? `sent a document: ${fileName}` : "sent a PDF document";
          } else if (fileTypeLower.includes("audio") || fileTypeLower.includes("mp3") || fileTypeLower.includes("wav")) {
            notificationBody = fileName ? `sent an audio: ${fileName}` : "sent an audio file";
          } else if (fileTypeLower.includes("video") || fileTypeLower.includes("mp4") || fileTypeLower.includes("mov")) {
            notificationBody = fileName ? `sent a video: ${fileName}` : "sent a video";
          } else if (fileTypeLower.includes("doc") || fileTypeLower.includes("word")) {
            notificationBody = fileName ? `sent a document: ${fileName}` : "sent a document";
          } else {
            notificationBody = fileName ? `sent a file: ${fileName}` : "sent a document";
          }
        } else {
          notificationBody = fileName ? `sent a file: ${fileName}` : "sent a document";
        }
      } else {
        notificationBody = "sent a message";
      }

      // Get user's active FCM tokens
      const tokens = await UserFcmToken.query()
        .where({ userId: recipientUserId, isActive: true })
        .select("fcmToken");

      if (tokens.length === 0) {
        return;
      }

      const fcmTokens = tokens.map((t) => t.fcmToken);

      // Send push notifications directly (no database save)
      await firebaseService.sendBulkPushNotifications(
        fcmTokens,
        `New message from ${senderName}`,
        notificationBody,
        {
          type: "new_message",
          conversationId: conversationId.toString(),
          senderUserId: senderUserId.toString(),
          messageType: messageType,
        }
      );
    } catch (error: any) {
      Logger.error(`Error sending message push notification: ${error?.message || "Unknown error"}`);
    }
  }
}
