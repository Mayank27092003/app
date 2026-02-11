import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { User } from "./users";
import { Message } from "./message";
import { ConversationParticipant } from "./conversationParticipant";

export class Conversation extends Model {
  id!: number;
  jobId?: number;
  chatType!: "direct" | "group";
  title?: string;
  lastMessageAt?: string;
  lastMessageId?: number;   // 👈 new field
  createdAt?: string;
  updatedAt?: string;

  job?: Job;
  participants?: ConversationParticipant[];
  messages?: Message[];
  lastMessage?: Message;

  static tableName = "conversations";

  static jsonSchema = {
    type: "object",
    required: ["chatType"],
    properties: {
      id: { type: "integer" },
      jobId: { type: ["integer", "null"] },
      chatType: { 
        type: "string", 
        enum: ["direct", "group", "job"],
        description: "direct: 1-on-1, group: multiple users, job: job-related chat"
      },
      title: { type: ["string", "null"] },
      lastMessageAt: { type: ["string", "null"] },
      lastMessageId: { type: ["integer", "null"] }, // 👈 new key in schema
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "conversations.jobId", to: "jobs.id" },
    },
    participants: {
      relation: Model.HasManyRelation,
      modelClass: ConversationParticipant,
      join: { from: "conversations.id", to: "conversationParticipants.conversationId" },
    },
    messages: {
      relation: Model.HasManyRelation,
      modelClass: Message,
      join: { from: "conversations.id", to: "messages.conversationId" },
    },
    lastMessage: {
      relation: Model.BelongsToOneRelation, // 👈 better than HasOne for lastMessageId
      modelClass: Message,
      join: { from: "conversations.lastMessageId", to: "messages.id" },
    },
  });
}
