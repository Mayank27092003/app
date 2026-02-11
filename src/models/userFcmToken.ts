import { Model, RelationMappings } from "objection";
import { User } from "./users";

export class UserFcmToken extends Model {
  id!: number;
  userId!: number;
  fcmToken!: string;
  deviceId?: string; // Optional device identifier
  deviceType?: string; // e.g., "android", "ios", "web"
  deviceName?: string; // e.g., "iPhone 12", "Samsung Galaxy"
  isActive!: boolean; // Whether this token is currently active
  lastUsedAt?: string; // When this token was last used
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Relations
  user?: User;

  static tableName = "userFcmTokens";

  static jsonSchema = {
    type: "object",
    required: ["userId", "fcmToken"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      fcmToken: { type: "string", minLength: 1 },
      deviceId: { type: ["string", "null"], maxLength: 255 },
      deviceType: { type: ["string", "null"], maxLength: 50 },
      deviceName: { type: ["string", "null"], maxLength: 255 },
      isActive: { type: "boolean", default: true },
      lastUsedAt: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userFcmTokens.userId", to: "users.id" },
    },
  });

  // Indexes for better performance
  static get indexes() {
    return [
      {
        name: "idx_user_fcm_tokens_user_id",
        columns: ["userId"],
      },
      {
        name: "idx_user_fcm_tokens_fcm_token",
        columns: ["fcmToken"],
      },
      {
        name: "idx_user_fcm_tokens_device_id",
        columns: ["deviceId"],
      },
      {
        name: "idx_user_fcm_tokens_active",
        columns: ["isActive"],
      },
    ];
  }
}
