import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";

export class SubContract extends Model {
  id!: number;

  // Relationships
  rootContractId!: number;        // root contract (top level)
  parentContractId!: number;      // immediate parent
  subContractId!: number;         // child contract reference
  resharedJobId!: number;         // job this subcontract represents

  // Financial splits
  splitPercentage!: number;       // percentage given to subcontractor
  splitAmount!: number;           // calculated split amount

  // Platform commissions
  platformCommissionPercent?: number | null; // ✅ include this
  platformCommissionAmount!: number;
  commissionType!: "percentage" | "fixed_amount";

  // Audit fields
  createdAt!: string;
  updatedAt!: string;

  static tableName = "subContracts";

  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "rootContractId",
        "parentContractId",
        "subContractId",
        "splitPercentage",
        "splitAmount",
        "commissionType",
      ],
      properties: {
        id: { type: "integer" },
        rootContractId: { type: "integer" },
        parentContractId: { type: "integer" },
        subContractId: { type: "integer" },
        resharedJobId: { type: "integer" },
        splitPercentage: { type: "number" },
        splitAmount: { type: "number" },
        platformCommissionPercent: { type: ["number", "null"] },
        platformCommissionAmount: { type: "number" },
        commissionType: { type: "string", enum: ["percentage", "fixed_amount"] },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    };
  }

  static relationMappings = (): RelationMappings => ({
    rootContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.rootContractId", to: "contracts.id" },
    },
    parentContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.parentContractId", to: "contracts.id" },
    },
    subContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.subContractId", to: "contracts.id" },
    },
  });
}
