import { ChatController } from "../controllers/chat";
import { authenticateToken } from "../middlewares/authentication";
import { useValidator } from "../middlewares/validate";
import { createConversationSchema, sendMessageSchema } from "../validators/chat.schema";

const controller = new ChatController();

export default [
  // Create conversation
  {
    path: "/conversations",
    controller: { post: controller.createConversation },
    validators: { post: useValidator(createConversationSchema) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Create a new conversation",
        tags: ["Chat"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["chatType", "participantUserIds"],
                properties: {
                  chatType: { 
                    type: "string", 
                    enum: ["direct", "group", "job"],
                    description: "Type of conversation"
                  },
                  title: { type: "string", description: "Conversation title (optional)" },
                  jobId: { type: "integer", description: "Job ID for job conversations" },
                  participantUserIds: { 
                    type: "array", 
                    items: { type: "integer" },
                    description: "Array of user IDs to include in conversation"
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Conversation created successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get user conversations
  {
    path: "/conversations",
    controller: { get: controller.getUserConversations },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get user's conversations",
        tags: ["Chat"],
        parameters: [
          {
            name: "archived",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["exclude", "include", "only"], default: "exclude" },
            description: "Control archived conversations visibility: exclude (default), include, only",
          },
        ],
        responses: {
          200: { description: "Conversations retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get conversation details
  {
    path: "/conversations/:id",
    controller: { get: controller.getConversationDetails },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get conversation details (without messages)",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        responses: {
          200: { description: "Conversation details retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
          404: { description: "Conversation not found" },
        },
      },
    },
  },

  // Get message history with pagination
  {
    path: "/conversations/:id/messages/history",
    controller: { get: controller.getMessageHistory },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get message history with pagination, message status, time range filtering, and text search",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number (default: 1)",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
            description: "Number of messages per page (default: 50, max: 100)",
          },
          {
            name: "startDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Filter messages from this date (ISO 8601 format)",
            example: "2024-01-01T00:00:00Z"
          },
          {
            name: "endDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Filter messages until this date (ISO 8601 format)",
            example: "2024-12-31T23:59:59Z"
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string", maxLength: 100 },
            description: "Search messages by content (case-insensitive partial match)",
            example: "hello world"
          },
        ],
        responses: {
          200: { 
            description: "Message history retrieved successfully (raw data for performance)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        messages: {
                          type: "array",
                          description: "Array of message objects with all relations (sender, replyToMessage, messageStatus) - raw data for performance",
                          items: {
                            type: "object",
                            description: "Message object with nested relations"
                          }
                        },
                        pagination: {
                          type: "object",
                          properties: {
                            currentPage: { type: "integer" },
                            totalPages: { type: "integer" },
                            totalMessages: { type: "integer" },
                            hasNextPage: { type: "boolean" },
                            hasPreviousPage: { type: "boolean" }
                          }
                        },
                        filters: {
                          type: "object",
                          properties: {
                            startDate: { type: ["string", "null"], format: "date-time" },
                            endDate: { type: ["string", "null"], format: "date-time" },
                            searchText: { type: ["string", "null"] },
                            userJoinedAt: { type: ["string", "null"], format: "date-time" },
                            userLeftAt: { type: ["string", "null"], format: "date-time" }
                          },
                          description: "Applied filters including user participation window, custom date range, and search text"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Bad request - invalid parameters (page, limit, date format, date range, or search text length)" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
          404: { description: "Conversation not found" },
        },
      },
    },
  },

  // Send message
  {
    path: "/conversations/:id/messages",
    controller: { post: controller.sendMessage },
    validators: { post: useValidator(sendMessageSchema) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Send a message to conversation",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messageType"],
                properties: {
                  content: { 
                    type: "string", 
                    description: "Message content (required for text/system messages, optional for file/image messages)" 
                  },
                  messageType: { 
                    type: "string", 
                    enum: ["text", "file", "image", "system"],
                    description: "Type of message"
                  },
                  fileType: { 
                    type: "string", 
                    description: "Specific file type (for file messages only). Common types: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, jpg, jpeg, png, gif, mp3, wav, mp4, avi, zip, rar, csv, json, etc.",
                    examples: ["pdf", "doc", "docx", "mp3", "mp4", "jpg", "png", "txt", "zip", "csv"],
                    example: "pdf"
                  },
                  fileUrl: { type: "string", description: "File URL (for file/image messages)" },
                  fileName: { type: "string", description: "File name (for file/image messages)" },
                  fileSize: { type: "number", description: "File size in bytes (for file/image messages)" },
                  replyToMessageId: { type: "integer", description: "ID of message being replied to (optional)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Message sent successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
        },
      },
    },
  },

  // Add participant
  {
    path: "/conversations/:id/participants",
    controller: { post: controller.addParticipant },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Add participant to conversation",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "integer", description: "User ID to add" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Participant added successfully" },
          400: { description: "Bad request - missing user ID" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Remove participant
  {
    path: "/conversations/:id/participants/:userId",
    controller: { delete: controller.removeParticipant },
    middlewares: { delete: [authenticateToken] },
    docs: {
      delete: {
        summary: "Remove participant from conversation",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID to remove",
          },
        ],
        responses: {
          200: { description: "Participant removed successfully" },
          400: { description: "Bad request - invalid IDs" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Toggle archive conversation
  {
    path: "/conversations/:id/archive",
    controller: { patch: controller.toggleArchiveConversation },
    middlewares: { patch: [authenticateToken] },
    docs: {
      patch: {
        summary: "Toggle archive conversation (archive/unarchive)",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        responses: {
          200: { 
            description: "Conversation archive status toggled successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        isArchived: { type: "boolean", description: "Current archive status" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Bad request - invalid conversation ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
        },
      },
    },
  },

  // Get unread message count
  {
    path: "/unread-count",
    controller: { get: controller.getUnreadMessageCount },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get unread message count for user",
        tags: ["Chat"],
        responses: {
          200: { description: "Unread count retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Search conversations
  {
    path: "/search",
    controller: { get: controller.searchConversations },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Search conversations by message content",
        tags: ["Chat"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Search query",
          },
        ],
        responses: {
          200: { description: "Search results retrieved successfully" },
          400: { description: "Bad request - search query required" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get or create direct conversation
  {
    path: "/conversations/direct",
    controller: { post: controller.getOrCreateDirectConversation },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Get or create direct conversation with a user",
        tags: ["Chat"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["receiverUserId"],
                properties: {
                  receiverUserId: { type: "integer", description: "User ID of the receiver" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Conversation returned" },
          400: { description: "Bad request - invalid receiverUserId" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Mark message as received
  {
    path: "/messages/:messageId/received",
    controller: { patch: controller.markMessageAsReceived },
    middlewares: { patch: [authenticateToken] },
    docs: {
      patch: {
        summary: "Mark a specific message as received",
        tags: ["Chat"],
        parameters: [
          {
            name: "messageId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Message ID",
          },
        ],
        responses: {
          200: { description: "Message marked as received successfully" },
          400: { description: "Bad request - invalid message ID" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Mark messages as read
  {
    path: "/conversations/:id/read",
    controller: { patch: controller.markMessagesAsRead },
    middlewares: { patch: [authenticateToken] },
    docs: {
      patch: {
        summary: "Mark all messages in conversation as read",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        responses: {
          200: { description: "Messages marked as read successfully" },
          400: { description: "Bad request - invalid conversation ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
        },
      },
    },
  },

  // Get message read status
  {
    path: "/conversations/:id/read-status",
    controller: { get: controller.getMessageReadStatus },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get message read status for conversation",
        tags: ["Chat"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Conversation ID",
          },
        ],
        responses: {
          200: { 
            description: "Message read status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        unreadCount: { type: "integer", description: "Number of unread messages" },
                        lastReadAt: { type: "string", format: "date-time", description: "Last read timestamp" },
                        messages: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              isRead: { type: "boolean" },
                              readAt: { type: "string", format: "date-time" },
                              senderUserId: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid conversation ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to conversation" },
        },
      },
    },
  },

  // Update message
  {
    path: "/messages/:messageId",
    controller: { put: controller.updateMessage },
    middlewares: { put: [authenticateToken] },
    docs: {
      put: {
        summary: "Update a message (only sender can edit). Can update content, message type, and file fields.",
        tags: ["Chat"],
        parameters: [
          {
            name: "messageId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Message ID to update",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "Updated message content (optional)",
                    example: "Updated message content",
                  },
                  messageType: {
                    type: "string",
                    enum: ["text", "file", "image", "system"],
                    description: "Updated message type (optional)",
                  },
                  fileType: {
                    type: "string",
                    description: "Updated file type (optional)",
                    example: "pdf",
                  },
                  fileUrl: {
                    type: "string",
                    format: "uri",
                    description: "Updated file URL (optional)",
                    example: "https://example.com/updated-file.pdf",
                  },
                  fileName: {
                    type: "string",
                    description: "Updated file name (optional)",
                    example: "updated-document.pdf",
                  },
                  fileSize: {
                    type: "number",
                    description: "Updated file size in bytes (optional)",
                    example: 1024000,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Message updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Message updated successfully" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        content: { type: "string" },
                        isEdited: { type: "boolean" },
                        editedAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid message ID or content" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - not the message sender" },
          404: { description: "Message not found" },
        },
      },
    },
  },

  // Delete message
  {
    path: "/messages/:messageId",
    controller: { delete: controller.deleteMessage },
    middlewares: { delete: [authenticateToken] },
    docs: {
      delete: {
        summary: "Delete a message (only sender can delete)",
        tags: ["Chat"],
        parameters: [
          {
            name: "messageId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Message ID to delete",
          },
        ],
        responses: {
          200: {
            description: "Message deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Message deleted successfully" },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid message ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - not the message sender" },
          404: { description: "Message not found" },
        },
      },
    },
  },
];
