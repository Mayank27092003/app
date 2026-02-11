import { Model, RelationMappings } from "objection";
import { User } from "./users";

export class Notification extends Model {
  id!: number;
  userId!: number;
  type!: string;
  title!: string;
  message!: string;
  entityType?: string | null;
  entityId?: number | null;
  read!: boolean;
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Relations
  user?: User;

  static tableName = "notifications";

  static jsonSchema = {
    type: "object",
    required: ["userId", "type", "title", "message"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      type: { type: "string", maxLength: 100 },
      title: { type: "string", maxLength: 255 },
      message: { type: "string" },
      entityType: { type: ["string", "null"], maxLength: 50 },
      entityId: { type: ["integer", "null"] },
      read: { type: "boolean", default: false },
      readAt: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "notifications.userId", to: "users.id" },
    },
  });
}

