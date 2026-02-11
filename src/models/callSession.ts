import { Model } from "objection";import { CallParticipant } from "./callParticipant";
;

export class CallSession extends Model {
  static tableName = "call_sessions";

  id!: number;
  callerId!: number;
  conversationId!: number;
  callType!: "audio" | "video"
  isGroupCall!: boolean;
  status!: "initiating" | "ringing" | "connected" | "ended" | "declined" | "missed" | "busy";
  startTime?: string;
  endTime?: string;
  duration?: number; // in seconds
  callQuality?: "excellent" | "good" | "fair" | "poor";
  networkType?: "wifi" | "cellular" | "ethernet" | "unknown";
  createdAt!: string;
  updatedAt!: string;

  static jsonSchema = {
    type: "object",
    required: ["callerId", "conversationId", "callType", "isGroupCall", "status"],
    properties: {
      id: { type: "integer" },
      callerId: { type: "integer" },
      conversationId: { type: "integer" },
      callType: { type: "string", enum: ["audio", "video"] },
      isGroupCall: { type: "boolean" },
      status: { 
        type: "string", 
        enum: ["initiating", "ringing", "connected", "ended", "declined", "missed", "busy"] 
      },
      startTime: { type: ["string", "null"] },
      endTime: { type: ["string", "null"] },
      duration: { type: ["integer", "null"] },
      callQuality: { 
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
    caller: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => require("./users").User,
      join: {
        from: "call_sessions.callerId",
        to: "users.id",
      },
    },
    conversation: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => require("./conversation").Conversation,
      join: {
        from: "call_sessions.conversationId",
        to: "conversations.id",
      },
    },
    participants:{
      relation:Model.HasManyRelation,
      modelClass:CallParticipant,
      join:{
        from:"call_sessions.id",
        to:"call_participants.callSessionId"
      }
    }
  };

  $beforeInsert() {
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  // Calculate call duration
  calculateDuration(): number | null {
    if (this.startTime && this.endTime) {
      const start = new Date(this.startTime).getTime();
      const end = new Date(this.endTime).getTime();
      return Math.floor((end - start) / 1000);
    }
    return null;
  }

  // Check if call is active
  isActive(): boolean {
    return this.status === "connected" || this.status === "ringing";
  }

  // Check if call is ended
  isEnded(): boolean {
    return ["ended", "declined", "missed", "busy"].includes(this.status);
  }
}
