import { Request, Response } from "express";
import { ChatService } from "../../services/chat";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Create a new conversation
   * POST /chat/conversations
   */
  createConversation = async (req: Request, res: Response) => {
    try {
      const { chatType, title, jobId, participantUserIds } = req.body;
      const createdByUserId = (req as any).user?.id;

      if (!createdByUserId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!chatType || !participantUserIds || !Array.isArray(participantUserIds)) {
        throw new HttpException("Missing required fields", 400);
      }

      // Add creator to participants if not already included
      if (!participantUserIds.includes(createdByUserId)) {
        participantUserIds.push(createdByUserId);
      }

      const conversation = await this.chatService.createConversation({
        chatType,
        title,
        jobId,
        participantUserIds,
        createdByUserId,
      });

      res.status(201).json({
        success: true,
        message: "Conversation created successfully",
        data: conversation,
      });
    } catch (error: any) {
      Logger.error(`Error in createConversation controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get or create direct conversation by receiverId */
  getOrCreateDirectConversation = async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.id;
      const receiverUserId = Number(req.body?.receiverUserId);

      if (!currentUserId) throw new HttpException("User not authenticated", 401);
      if (!receiverUserId || Number.isNaN(receiverUserId)) throw new HttpException("Valid receiverUserId is required", 400);

      const conversation = await this.chatService.getOrCreateDirectConversation({
        currentUserId,
        receiverUserId,
      });

      res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
      Logger.error(`Error in getOrCreateDirectConversation controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get user's conversations */
  getUserConversations = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new HttpException("User not authenticated", 401);

      const archivedParam = (req.query.archived as string) || "exclude";
      const archivedMode = ["exclude", "include", "only"].includes(archivedParam)
        ? (archivedParam as "exclude" | "include" | "only")
        : "exclude";

      const conversations = await this.chatService.getUserConversations(userId, archivedMode);

      res.json({ success: true, data: conversations, count: conversations.length });
    } catch (error: any) {
      Logger.error(`Error in getUserConversations controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get conversation details */
  getConversationDetails = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);

      const conversation = await this.chatService.getConversationDetails(conversationId, userId);

      res.json({ success: true, data: conversation });
    } catch (error: any) {
      Logger.error(`Error in getConversationDetails controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get message history with pagination */
  getMessageHistory = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const searchText = req.query.search as string;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);
      if (page < 1) throw new HttpException("Page must be greater than 0", 400);
      if (limit < 1 || limit > 100) throw new HttpException("Limit must be between 1 and 100", 400);

      // Validate date format if provided
      if (startDate && isNaN(Date.parse(startDate))) {
        throw new HttpException("Invalid startDate format. Use ISO 8601 format", 400);
      }
      if (endDate && isNaN(Date.parse(endDate))) {
        throw new HttpException("Invalid endDate format. Use ISO 8601 format", 400);
      }

      // Validate date range
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new HttpException("startDate must be before endDate", 400);
      }

      // Validate search text length
      if (searchText && searchText.length > 100) {
        throw new HttpException("Search text must be 100 characters or less", 400);
      }

      const result = await this.chatService.getMessageHistory(conversationId, userId, page, limit, startDate, endDate, searchText);

      res.json({ success: true, data: result });
    } catch (error: any) {
      Logger.error(`Error in getMessageHistory controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Send a message */
  sendMessage = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const { content, messageType, fileType, fileUrl, fileName, fileSize, replyToMessageId } = req.body;
      const senderUserId = (req as any).user?.id;

      if (!senderUserId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);
      // Validation is now handled by the schema validator

      const message = await this.chatService.sendMessage({
        conversationId,
        senderUserId,
        content,
        messageType,
        fileType,
        fileUrl,
        fileName,
        fileSize,
        replyToMessageId: replyToMessageId ? parseInt(replyToMessageId) : undefined,
      });

      res.status(201).json({ success: true, message: "Message sent successfully", data: message });
    } catch (error: any) {
      Logger.error(`Error in sendMessage controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Add participant */
  addParticipant = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const { userId } = req.body;
      const currentUserId = (req as any).user?.id;

      if (!currentUserId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);
      if (!userId) throw new HttpException("User ID is required", 400);

      await this.chatService.addParticipant(conversationId, userId);

      res.json({ success: true, message: "Participant added successfully" });
    } catch (error: any) {
      Logger.error(`Error in addParticipant controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Remove participant */
  removeParticipant = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const participantUserId = parseInt(String(req.params.userId));
      const currentUserId = (req as any).user?.id;

      if (!currentUserId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);
      if (!participantUserId || isNaN(participantUserId)) throw new HttpException("Valid participant user ID is required", 400);

      await this.chatService.removeParticipant(conversationId, participantUserId);

      res.json({ success: true, message: "Participant removed successfully" });
    } catch (error: any) {
      Logger.error(`Error in removeParticipant controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Toggle archive conversation */
  toggleArchiveConversation = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);

      const result = await this.chatService.toggleArchiveConversation(conversationId, userId);

      res.json({ 
        success: true, 
        message: `Conversation ${result.isArchived ? 'archived' : 'unarchived'} successfully`,
        data: { isArchived: result.isArchived }
      });
    } catch (error: any) {
      Logger.error(`Error in toggleArchiveConversation controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get unread message count */
  getUnreadMessageCount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new HttpException("User not authenticated", 401);

      const count = await this.chatService.getUnreadMessageCount(userId);

      res.json({ success: true, data: { unreadCount: count } });
    } catch (error: any) {
      Logger.error(`Error in getUnreadMessageCount controller:: ${error?.message || "Unknown error"}`);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  /** Search conversations */
  searchConversations = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const query = req.query.q as string;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!query) throw new HttpException("Search query is required", 400);

      const conversations = await this.chatService.searchConversations(userId, query);

      res.json({ success: true, data: conversations, count: conversations.length, query });
    } catch (error: any) {
      Logger.error(`Error in searchConversations controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Mark message as received */
  markMessageAsReceived = async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(String(req.params.messageId));
      const userId = (req as any).user?.id;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!messageId || isNaN(messageId)) throw new HttpException("Valid message ID is required", 400);

      await this.chatService.markMessageAsReceived(messageId, userId);

      res.json({ success: true, message: "Message marked as received successfully" });
    } catch (error: any) {
      Logger.error(`Error in markMessageAsReceived controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Mark messages as read */
  markMessagesAsRead = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);

      await this.chatService.markMessagesAsRead(conversationId, userId);

      res.json({ success: true, message: "Messages marked as read successfully" });
    } catch (error: any) {
      Logger.error(`Error in markMessagesAsRead controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Get message read status */
  getMessageReadStatus = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;

      if (!userId) throw new HttpException("User not authenticated", 401);
      if (!conversationId || isNaN(conversationId)) throw new HttpException("Valid conversation ID is required", 400);

      const readStatus = await this.chatService.getMessageReadStatus(conversationId, userId);

      res.json({ success: true, data: readStatus });
    } catch (error: any) {
      Logger.error(`Error in getMessageReadStatus controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Update message */
  updateMessage = async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(String(req.params.messageId));
      const { content, messageType, fileType, fileUrl, fileName, fileSize } = req.body;
      const currentUserId = (req as any).user?.id;

      if (!currentUserId) throw new HttpException("User not authenticated", 401);
      if (!messageId || isNaN(messageId)) throw new HttpException("Valid message ID is required", 400);

      // Prepare update data - only include fields that are provided
      const updateData: any = {};
      if (content !== undefined) updateData.content = content;
      if (messageType !== undefined) updateData.messageType = messageType;
      if (fileType !== undefined) updateData.fileType = fileType;
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
      if (fileName !== undefined) updateData.fileName = fileName;
      if (fileSize !== undefined) updateData.fileSize = fileSize;

      const updatedMessage = await this.chatService.updateMessage(messageId, currentUserId, updateData);

      res.json({ success: true, data: updatedMessage, message: "Message updated successfully" });
    } catch (error: any) {
      Logger.error(`Error in updateMessage controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /** Delete message */
  deleteMessage = async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(String(req.params.messageId));
      const currentUserId = (req as any).user?.id;

      if (!currentUserId) throw new HttpException("User not authenticated", 401);
      if (!messageId || isNaN(messageId)) throw new HttpException("Valid message ID is required", 400);

      await this.chatService.deleteMessage(messageId, currentUserId);

      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error: any) {
      Logger.error(`Error in deleteMessage controller:: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };
}
