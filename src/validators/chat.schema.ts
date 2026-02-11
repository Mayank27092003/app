import { JSONSchemaType } from "ajv";

export interface CreateConversationRequest {
  chatType: "direct" | "group" | "job";
  title?: string;
  jobId?: number;
  participantUserIds: number[];
}

export interface SendMessageRequest {
  content?: string; // 👈 now optional - required only for text/system messages
  messageType: "text" | "file" | "image" | "system";
  fileType?: string; // 👈 new field for specific file type
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToMessageId?: number; // 👈 new field for reply functionality
}

export const createConversationSchema: JSONSchemaType<CreateConversationRequest> = {
  type: "object",
  required: ["chatType", "participantUserIds"],
  properties: {
    chatType: {
      type: "string",
      enum: ["direct", "group", "job"],
      description: "Type of conversation",
    },
    title: {
      type: "string",
      maxLength: 200,
      nullable: true,
      description: "Conversation title (optional)",
    },
    jobId: {
      type: "integer",
      minimum: 1,
      nullable: true,
      description: "Job ID for job conversations",
    },
    participantUserIds: {
      type: "array",
      items: { type: "integer", minimum: 1 },
      minItems: 1,
      description: "Array of user IDs to include in conversation",
    },
  },
  additionalProperties: false,
};

export const sendMessageSchema: JSONSchemaType<SendMessageRequest> = {
  type: "object",
  required: ["messageType"],
  properties: {
    content: {
      type: "string",
      minLength: 1,
      maxLength: 5000,
      nullable: true,
      description: "Message content (required for text/system messages, optional for file/image messages)",
    },
    messageType: {
      type: "string",
      enum: ["text", "file", "image", "system"],
      description: "Type of message",
    },
    fileType: {
      type: "string",
      maxLength: 50,
      nullable: true,
      description: "Specific file type (for file messages only)",
    },
    fileUrl: {
      type: "string",
      format: "uri",
      nullable: true,
      description: "File URL (for file/image messages)",
    },
    fileName: {
      type: "string",
      maxLength: 255,
      nullable: true,
      description: "File name (for file/image messages)",
    },
    fileSize: {
      type: "number",
      minimum: 0,
      nullable: true,
      description: "File size in bytes (for file/image messages)",
    },
    replyToMessageId: {
      type: "integer",
      minimum: 1,
      nullable: true,
      description: "ID of message being replied to (optional)",
    },
  },
  additionalProperties: false,
  // Custom validation rules
  if: {
    properties: {
      messageType: { const: "text" }
    }
  },
  then: {
    required: ["content"],
    properties: {
      content: {
        type: "string",
        minLength: 1,
        maxLength: 5000,
        description: "Content is required for text messages",
      }
    }
  },
  else: {
    if: {
      properties: {
        messageType: { const: "system" }
      }
    },
    then: {
      required: ["content"],
      properties: {
        content: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
          description: "Content is required for system messages",
        }
      }
    },
    else: {
      if: {
        properties: {
          messageType: { const: "file" }
        }
      },
      then: {
        required: ["fileType", "fileUrl", "fileName"],
        properties: {
          fileType: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            description: "File type is required for file messages",
          },
          fileUrl: {
            type: "string",
            format: "uri",
            description: "File URL is required for file messages",
          },
          fileName: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            description: "File name is required for file messages",
          }
        }
      },
      else: {
        if: {
          properties: {
            messageType: { const: "image" }
          }
        },
        then: {
          required: ["fileUrl", "fileName"],
          properties: {
            fileUrl: {
              type: "string",
              format: "uri",
              description: "File URL is required for image messages",
            },
            fileName: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "File name is required for image messages",
            }
          }
        }
      }
    }
  }
};
