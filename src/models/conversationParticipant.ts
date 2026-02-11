import { Model, RelationMappings } from "objection";
import { Conversation } from "./conversation";
import { User } from "./users";

export class ConversationParticipant extends Model {
  id!: number;
  conversationId!: number;
  userId!: number;
  joinedAt?: string;
  leftAt?: string | null;
  archivedAt?: string | null;
  role!:string;
  conversation?: Conversation;
  user?: User;

  static tableName = "conversationParticipants";

  static jsonSchema = {
    type: "object",
    required: ["conversationId", "userId"],
    properties: {
      id: { type: "integer" },
      conversationId: { type: "integer" },
      userId: { type: "integer" },
      joinedAt: { type: ["string", "null"] },
      leftAt: { type: ["string", "null"] },
      archivedAt: { type: ["string", "null"] },
      role:{type:["string"]}
    },
  };

  static relationMappings = (): RelationMappings => ({
    conversation: {
      relation: Model.BelongsToOneRelation,
      modelClass: Conversation,
      join: { from: "conversationParticipants.conversationId", to: "conversations.id" },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "conversationParticipants.userId", to: "users.id" },
    },
  });
}



