import { Model } from "objection";

export class CallParticipant extends Model {
  static tableName = "call_participants";

  id!: number;
  callSessionId!: number;
  userId!: number;
  joinedAt?: string;
  leftAt?: string;
  isMuted!: boolean;
  isVideoEnabled!: boolean;
  isScreenSharing!: boolean;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
  networkType?: "wifi" | "cellular" | "ethernet" | "unknown";
  createdAt!: string;
  updatedAt!: string;

  static jsonSchema = {
    type: "object",
    required: ["callSessionId", "userId", "isMuted", "isVideoEnabled", "isScreenSharing"],
    properties: {
      id: { type: "integer" },
      callSessionId: { type: "integer" },
      userId: { type: "integer" },
      joinedAt: { type: ["string", "null"] },
      leftAt: { type: ["string", "null"] },
      isMuted: { type: "boolean" },
      isVideoEnabled: { type: "boolean" },
      isScreenSharing: { type: "boolean" },
      connectionQuality: { 
        type: ["string", "null"], 
        enum: ["excellent", "good", "fair", "poor", null] 
      },
      networkType: { 
        type: ["string", "null"], 
        enum: ["wifi", "cellular", "ethernet", "unknown", null] 
      },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = {
    callSession: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => require("./callSession").CallSession,
      join: {
        from: "call_participants.callSessionId",
        to: "call_sessions.id",
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => require("./users").User,
      join: {
        from: "call_participants.userId",
        to: "users.id",
      },
    },
  };

  $beforeInsert() {
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  // Check if participant is active in the call
  isActive(): boolean {
    return !!this.joinedAt && !this.leftAt;
  }

  // Get participant duration in the call
  getDuration(): number | null {
    if (this.joinedAt && this.leftAt) {
      const joined = new Date(this.joinedAt).getTime();
      const left = new Date(this.leftAt).getTime();
      return Math.floor((left - joined) / 1000);
    }
    return null;
  }
}
