import { Model, RelationMappings } from "objection";
import { User } from "./users";

export class UserOnlineStatus extends Model {
  id!: number;
  userId!: number;
  isOnline!: boolean;
  lastOnline!: string;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  user?: User;

  static get tableName(): string {
    return "user_online_status";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["userId", "isOnline"],
      properties: {
        id: { type: "integer" },
        userId: { type: "integer" },
        isOnline: { type: "boolean" },
        lastOnline: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      }
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "user_online_status.userId",
          to: "users.id"
        }
      }
    };
  }
}
