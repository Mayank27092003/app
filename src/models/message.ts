import { Model, RelationMappings } from "objection";
import { Conversation } from "./conversation";
import { User } from "./users";

export class Message extends Model {
  id!: number;
  conversationId!: number;
  senderUserId?: number;   // 👈 now nullable
  content!: string;
  messageType!: "text" | "file" | "image" | "system";
  fileType?: string; // 👈 new field for specific file type (pdf, doc, audio, video, etc.)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isSystem!: boolean;             // 👈 new field
  replyToMessageId?: number | null; // 👈 new field for reply functionality
  isEdited!: boolean;             // 👈 new field for edit tracking
  isDeleted!: boolean;            // 👈 new field for delete tracking
  editedAt?: string | null;       // 👈 new field for edit timestamp
  deletedAt?: string | null;      // 👈 new field for delete timestamp
  createdAt?: string;
  updatedAt?: string;
  sentAt?:string;
  conversation?: Conversation;
  sender?: User;
  replyToMessage?: Message; // 👈 relation for replied message
  replies?: Message[]; // 👈 relation for messages that reply to this message

  static tableName = "messages";

  static jsonSchema = {
    type: "object",
    required: ["conversationId", "content", "messageType"],
    properties: {
      id: { type: "integer" },
      conversationId: { type: "integer" },
      senderUserId: { type: ["integer", "null"] }, // 👈 nullable now
      content: { type: "string" },
      messageType: { 
        type: "string", 
        enum: ["text", "file", "image", "system"],
        default: "text"
      },
      fileType: { type: ["string", "null"] }, // 👈 new field for specific file type
      fileUrl: { type: ["string", "null"] },
      fileName: { type: ["string", "null"] },
      fileSize: { type: ["number", "null"] },
      isSystem: { type: "boolean", default: false }, // 👈 added
      replyToMessageId: { type: ["integer", "null"] }, // 👈 added for reply functionality
      isEdited: { type: "boolean", default: false }, // 👈 added for edit tracking
      isDeleted: { type: "boolean", default: false }, // 👈 added for delete tracking
      editedAt: { type: ["string", "null"] }, // 👈 added for edit timestamp
      deletedAt: { type: ["string", "null"] }, // 👈 added for delete timestamp
      sentAt: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    conversation: {
      relation: Model.BelongsToOneRelation,
      modelClass: Conversation,
      join: { from: "messages.conversationId", to: "conversations.id" },
    },
    sender: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "messages.senderUserId", to: "users.id" },
    },
    replyToMessage: {
      relation: Model.BelongsToOneRelation,
      modelClass: Message,
      join: { from: "messages.replyToMessageId", to: "messages.id" },
    },
    replies: {
      relation: Model.HasManyRelation,
      modelClass: Message,
      join: { from: "messages.id", to: "messages.replyToMessageId" },
    },
  });
}
