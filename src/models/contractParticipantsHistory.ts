import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { ContractParticipant } from "./contractParticipants";

export class ContractParticipantHistory extends Model {
  id!: number;
  contractParticipantId?: number;
  userId?: number;
  action!: "added" | "removed" | "roleChanged" | "statusChanged";
  changedByUserId?: number;
  oldValue?: object;
  newValue?: object;
  reason?: string;
  changedAt?: string;

  static tableName = "contractParticipantHistory";

  static jsonSchema = {
    type: "object",
    required: ["action"],
    properties: {
      id: { type: "integer" },
      contractParticipantId: { type: ["integer", "null"] },
      userId: { type: ["integer", "null"] },
      action: { type: "string", enum: ["added", "removed", "roleChanged", "statusChanged"] },
      changedByUserId: { type: ["integer", "null"] },
      oldValue: { type: ["object", "null"] },
      newValue: { type: ["object", "null"] },
      reason: { type: ["string", "null"] },
      changedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    participant: {
      relation: Model.BelongsToOneRelation,
      modelClass: ContractParticipant,
      join: { from: "contractParticipantHistory.contractParticipantId", to: "contractParticipants.id" },
      filter: (query) => query.whereNotNull("contractParticipantHistory.contractParticipantId"),
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "contractParticipantHistory.userId", to: "users.id" },
    },
    changedBy: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "contractParticipantHistory.changedByUserId", to: "users.id" },
    },
  });
}
