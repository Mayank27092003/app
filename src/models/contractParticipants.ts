import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Contract } from "./contracts";
import { ContractParticipantHistory } from "./contractParticipantsHistory";

export class ContractParticipant extends Model {
  id!: number;
  contractId!: number;
  userId!: number;
  role!: "driver" | "broker" | "shipper" | "carrier" | "admin" | "support";
  status!: "active" | "removed" | "invited";
  joinedAt?: string;
  removedAt?: string;
  addedByUserId?: number;
  removedByUserId?: number;
  reasonForChange?: string;
  notes?: string;
  isLocationVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;

  static tableName = "contractParticipants";

  static jsonSchema = {
    type: "object",
    required: ["contractId", "userId", "role"],
    properties: {
      id: { type: "integer" },
      contractId: { type: "integer" },
      userId: { type: "integer" },
      role: { type: "string", enum: ["driver", "broker", "shipper", "carrier", "admin", "support"] },
      status: { type: "string", enum: ["active", "removed", "invited"] },
      joinedAt: { type: ["string", "null"] },
      removedAt: { type: ["string", "null"] },
      addedByUserId: { type: ["integer", "null"] },
      removedByUserId: { type: ["integer", "null"] },
      reasonForChange: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
      isLocationVisible: { type: ["boolean", "null"] },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    contract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "contractParticipants.contractId", to: "contracts.id" },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "contractParticipants.userId", to: "users.id" },
    },
    history: {
      relation: Model.HasManyRelation,
      modelClass: ContractParticipantHistory,
      join: { from: "contractParticipants.id", to: "contractParticipantHistory.contractParticipantId" },
    },
  });
}
