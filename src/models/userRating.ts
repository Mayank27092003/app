import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";
import { User } from "./users";

export class UserRating extends Model {
  id!: number;
  contractId!: number;
  raterUserId!: number;
  rateeUserId!: number;
  stars!: number; // 1-5
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;

  static tableName = "userRatings";

  static jsonSchema = {
    type: "object",
    required: ["contractId", "raterUserId", "rateeUserId", "stars"],
    properties: {
      id: { type: "integer" },
      contractId: { type: "integer" },
      raterUserId: { type: "integer" },
      rateeUserId: { type: "integer" },
      stars: { type: "number", minimum: 1, maximum: 5 },
      comment: { type: ["string", "null"], maxLength: 1000 },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    contract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "userRatings.contractId", to: "contracts.id" },
    },
    rater: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userRatings.raterUserId", to: "users.id" },
    },
    ratee: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userRatings.rateeUserId", to: "users.id" },
    },
  });
}


