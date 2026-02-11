import { Model, RelationMappings } from "objection";
import { Message } from "./message";
import { User } from "./users";

export class MessageStatus extends Model {
  id!: number;
  messageId!: number;
  userId!: number;
  isRead!: boolean;
  isDelivered!: boolean;
  readAt?: string | null;
  deliveredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  message?: Message;
  user?: User;

  static tableName = "messageStatus";

  static jsonSchema = {
    type: "object",
    required: ["messageId", "userId"],
    properties: {
      id: { type: "integer" },
      messageId: { type: "integer" },
      userId: { type: "integer" },
      isRead: { type: "boolean", default: false },
      isDelivered: { type: "boolean", default: true },
      readAt: { type: ["string", "null"], format: "date-time" },
      deliveredAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    message: {
      relation: Model.BelongsToOneRelation,
      modelClass: Message,
      join: { from: "messageStatus.messageId", to: "messages.id" },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "messageStatus.userId", to: "users.id" },
    },
  });
}
