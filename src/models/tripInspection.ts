import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";
import { User } from "./users";

export class TripInspection extends Model {
  id!: number;
  contractId!: number;
  type!: "pre" | "post";
  driverUserId!: number;
  status!: "started" | "completed" | "submitted";
  startedAt!: string;
  completedAt?: string | null;
  submittedAt?: string | null;
  data?: any;
  defects?: any;
  photos?: any;
  podPhoto?: any;
  createdAt?: string;
  updatedAt?: string;

  static tableName = "tripInspections";

  static jsonSchema = {
    type: "object",
    required: ["contractId", "type", "driverUserId", "status", "startedAt"],
    properties: {
      id: { type: "integer" },
      contractId: { type: "integer" },
      type: { type: "string", enum: ["pre", "post"] },
      driverUserId: { type: "integer" },
      status: { type: "string", enum: ["started", "completed", "submitted"] },
      startedAt: { type: "string" },
      completedAt: { type: ["string", "null"] },
      submittedAt: { type: ["string", "null"] },
      data: { type: ["object", "null"] },
      defects: { type: ["object", "null"] },
      photos: { type: ["array", "null"], items: { type: "object" } },
      podPhoto: { type: ["object", "null"] },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    contract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "tripInspections.contractId", to: "contracts.id" },
    },
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "tripInspections.driverUserId", to: "users.id" },
    },
  });
}


