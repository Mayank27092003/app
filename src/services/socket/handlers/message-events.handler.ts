import { Logger } from "../../../utils/logger";
import { MESSAGE_EVENTS, ROOM_PREFIXES } from "../constants/events";
import { 
  MessageReadPayload, 
  MessageDeliveredPayload, 
  MessageReceivedPayload, 
  SystemMessagePayload 
} from "../types";

/**
 * Message events handler for socket events
 * Manages message-related event emissions
 */
export class MessageEventsHandler {
  private logger: typeof Logger;
  private io: any;

  constructor(io: any) {
    this.logger = Logger;
    this.io = io;
  }

  /**
   * Emit new message event
   */
  emitNewMessage(conversationId: number, messageData: any): void {
    const payload = {
      ...messageData,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(MESSAGE_EVENTS.NEW_MESSAGE, payload);
    this.logger.info(`New message event emitted: conversation ${conversationId} message ${messageData.id || 'unknown'}`);
  }

  /**
   * Emit system message event
   */
  emitSystemMessage(conversationId: number, message: string, metadata?: any): void {
    const payload: SystemMessagePayload = {
      conversationId,
      message,
      metadata,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(MESSAGE_EVENTS.SYSTEM_MESSAGE, payload);
    this.logger.info(`System message event emitted: conversation ${conversationId}`);
  }

  /**
   * Emit message read event
   */
  emitMessageRead(conversationId: number, readByUserId: number, readAt: string): void {
    const payload: MessageReadPayload = {
      conversationId,
      readByUserId,
      readAt,
      timestamp: new Date(),
    };

    // Emit to conversation room only
    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(MESSAGE_EVENTS.MESSAGE_READ, payload);
    this.logger.info(`Message read event emitted: conversation ${conversationId} by user ${readByUserId}`);
  }

  /**
   * Emit message delivered event
   */
  emitMessageDelivered(conversationId: number, messageId: number, deliveredToUserId: number, senderUserId: number): void {
    const payload: MessageDeliveredPayload = {
      conversationId,
      messageId,
      deliveredToUserId,
      timestamp: new Date(),
    };

    // Emit to sender only
    this.io.to(`${ROOM_PREFIXES.USER}${senderUserId}`).emit(MESSAGE_EVENTS.MESSAGE_DELIVERED, payload);
    this.logger.info(`Message delivered event emitted: message ${messageId} to user ${deliveredToUserId} by sender ${senderUserId}`);
  }

  /**
   * Emit message received event
   */
  emitMessageReceived(messageId: number, conversationId: number, receivedByUserId: number, senderUserId: number): void {
    const payload: MessageReceivedPayload = {
      messageId,
      conversationId,
      receivedByUserId,
      receivedAt: new Date().toISOString(),
      timestamp: new Date(),
    };

    // Emit to sender only
    this.io.to(`${ROOM_PREFIXES.USER}${senderUserId}`).emit(MESSAGE_EVENTS.MESSAGE_RECEIVED, payload);
    this.logger.info(`Message received event emitted: message ${messageId} by user ${receivedByUserId} to sender ${senderUserId}`);
  }

  /**
   * Emit message edited event
   */
  emitMessageEdited(conversationId: number, messageId: number, editedBy: number, newContent: string): void {
    const payload = {
      conversationId,
      messageId,
      editedBy,
      newContent,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_edited', payload);
    this.logger.info(`Message edited event emitted: message ${messageId} in conversation ${conversationId}`);
  }

  /**
   * Emit message deleted event
   */
  emitMessageDeleted(conversationId: number, messageId: number, deletedBy: number): void {
    const payload = {
      conversationId,
      messageId,
      deletedBy,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_deleted', payload);
    this.logger.info(`Message deleted event emitted: message ${messageId} in conversation ${conversationId}`);
  }

  /**
   * Emit message reaction event
   */
  emitMessageReaction(conversationId: number, messageId: number, userId: number, reaction: string, isAdded: boolean): void {
    const payload = {
      conversationId,
      messageId,
      userId,
      reaction,
      isAdded,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_reaction', payload);
    this.logger.info(`Message reaction event emitted: message ${messageId} reaction ${reaction} by user ${userId}`);
  }

  /**
   * Emit message reply event
   */
  emitMessageReply(conversationId: number, messageId: number, replyId: number, repliedBy: number): void {
    const payload = {
      conversationId,
      messageId,
      replyId,
      repliedBy,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_reply', payload);
    this.logger.info(`Message reply event emitted: reply ${replyId} to message ${messageId} in conversation ${conversationId}`);
  }

  /**
   * Emit message forwarded event
   */
  emitMessageForwarded(conversationId: number, messageId: number, forwardedBy: number, originalConversationId: number): void {
    const payload = {
      conversationId,
      messageId,
      forwardedBy,
      originalConversationId,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_forwarded', payload);
    this.logger.info(`Message forwarded event emitted: message ${messageId} to conversation ${conversationId}`);
  }

  /**
   * Emit message typing indicator
   */
  emitMessageTyping(conversationId: number, userId: number, isTyping: boolean): void {
    const payload = {
      conversationId,
      userId,
      isTyping,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_typing', payload);
  }

  /**
   * Emit message seen indicator
   */
  emitMessageSeen(conversationId: number, userId: number, messageId: number): void {
    const payload = {
      conversationId,
      userId,
      messageId,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_seen', payload);
    this.logger.info(`Message seen event emitted: message ${messageId} by user ${userId} in conversation ${conversationId}`);
  }

  /**
   * Emit conversation message count update
   */
  emitConversationMessageCountUpdate(conversationId: number, unreadCount: number, userId: number): void {
    const payload = {
      conversationId,
      unreadCount,
      userId,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${userId}`).emit('conversation_message_count_update', payload);
    this.logger.info(`Conversation message count update emitted: conversation ${conversationId} unread ${unreadCount} for user ${userId}`);
  }

  /**
   * Emit message attachment uploaded
   */
  emitMessageAttachmentUploaded(conversationId: number, messageId: number, attachmentId: number, uploadedBy: number): void {
    const payload = {
      conversationId,
      messageId,
      attachmentId,
      uploadedBy,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_attachment_uploaded', payload);
    this.logger.info(`Message attachment uploaded event emitted: attachment ${attachmentId} for message ${messageId}`);
  }

  /**
   * Emit message attachment download
   */
  emitMessageAttachmentDownloaded(conversationId: number, messageId: number, attachmentId: number, downloadedBy: number): void {
    const payload = {
      conversationId,
      messageId,
      attachmentId,
      downloadedBy,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit('message_attachment_downloaded', payload);
    this.logger.info(`Message attachment downloaded event emitted: attachment ${attachmentId} for message ${messageId}`);
  }
}
