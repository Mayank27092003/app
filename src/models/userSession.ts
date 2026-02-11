import { Model, RelationMappings } from "objection";
import { User } from "./users";

export class UserSession extends Model {
  id!: number;
  userId!: number;
  sessionId!: string;
  socketId!: string;
  userAgent?: string;
  ipAddress?: string;
  lastSeen!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  user?: User;

  static get tableName(): string {
    return "user_sessions";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["userId", "sessionId", "socketId"],
      properties: {
        id: { type: "integer" },
        userId: { type: "integer" },
        sessionId: { type: "string", minLength: 1 },
        socketId: { type: "string", minLength: 1 },
        userAgent: { type: "string" },
        ipAddress: { type: "string" },
        lastSeen: { type: "string", format: "date-time" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "user_sessions.userId",
          to: "users.id"
        }
      }
    };
  }
}
