import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";
import { StripePayment } from "./stripePayment";

export class Escrow extends Model {
  id!: number;
  contractId?: number | null;
  jobId?: number | null;
  amount!: number;
  status!: "pending" | "held" | "released" | "refunded";
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  contract?: Contract;
  stripePayments?: StripePayment[];

  static get tableName(): string {
    return "escrows";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["amount"],
      properties: {
        id: { type: "integer" },
        contractId: { type: ["integer", "null"] },
        jobId: { type: ["integer", "null"] },
        amount: { type: "number", minimum: 0 },
        status: { 
          type: "string", 
          enum: ["pending", "held", "released", "refunded"],
          default: "pending"
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      contract: {
        relation: Model.BelongsToOneRelation,
        modelClass: Contract,
        join: {
          from: "escrows.contractId",
          to: "contracts.id"
        }
      },
      stripePayments: {
        relation: Model.HasManyRelation,
        modelClass: StripePayment,
        join: {
          from: "escrows.id",
          to: "stripePayments.escrowId"
        }
      }
    };
  }
}
