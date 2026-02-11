import { Model, RelationMappings } from "objection";
import { Wallet } from "./wallet";
import { User } from "./users";

export class WalletTransaction extends Model {
  id!: number;
  walletId!: number;
  type!: "credit" | "debit" | "hold" | "release" | "withdrawal";
  amount!: number;
  status!: "initial" | "withdrawal_requested" | "processing" | "processed" | "failed" | "cancelled";
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt?: string;

  wallet?: Wallet;

  static tableName = "walletTransactions";

  static jsonSchema = {
    type: "object",
    required: ["walletId", "type", "amount"],
    properties: {
      id: { type: "integer" },
      walletId: { type: "integer" },
      type: { 
        type: "string", 
        enum: ["credit", "debit", "hold", "release", "withdrawal"] 
      },
      amount: { type: "number" },
      status: { 
        type: "string", 
        enum: ["initial", "withdrawal_requested", "processing", "processed", "failed", "cancelled"],
        default: "initial"
      },
      description: { type: "string" },
      referenceId: { type: ["integer", "null","string"] },
      referenceType: { type: ["string", "null"] },
      createdAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    wallet: {
      relation: Model.BelongsToOneRelation,
      modelClass: Wallet,
      join: { from: "walletTransactions.walletId", to: "wallets.id" },
    },
  });
}
