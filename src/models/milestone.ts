import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Contract } from "./contracts";


export class Milestone extends Model {
  id!: number;
  contractId!: number;
  title!: string;
  description?: string;
  amount!: number;
  status!: "pending" | "inProgress" | "completed" | "paid";
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;

  contract?: Contract;

  static tableName = "milestones";

  static jsonSchema = {
    type: "object",
    required: ["contractId", "title", "amount"],
    properties: {
      id: { type: "integer" },
      contractId: { type: "integer" },
      title: { type: "string" },
      description: { type: ["string", "null"] },
      amount: { type: "number" },
      status: {
        type: "string",
        enum: ["pending", "inProgress", "completed", "paid"],
      },
      dueDate: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    contract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: {
        from: "milestones.contractId",
        to: "contracts.id",
      },
    },
  });
}
