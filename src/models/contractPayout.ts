import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";
import { User } from "./users";
import { WalletTransaction } from "./walletTransaction";

export class ContractPayout extends Model {
  id!: number;
  contractId!: number;
  userId!: number;
  amount!: number;
  status!: "pending" | "transferring" | "transferred" | "failed";
  stripeTransferId?: string | null;
  stripePayoutId?: string | null;
  errorMessage?: string | null;
  walletTransactionId?: number | null;
  transferredAt?: string | null;
  createdAt!: string;
  updatedAt!: string;

  // Relations
  contract?: Contract;
  user?: User;
  walletTransaction?: WalletTransaction;

  static tableName = "contractPayouts";

  static jsonSchema = {
    type: "object",
    required: ["contractId", "userId", "amount"],
    properties: {
      id: { type: "integer" },
      contractId: { type: "integer" },
      userId: { type: "integer" },
      amount: { type: "number", minimum: 0 },
      status: {
        type: "string",
        enum: ["pending", "transferring", "transferred", "failed"],
        default: "pending",
      },
      stripeTransferId: { type: ["string", "null"] },
      stripePayoutId: { type: ["string", "null"] },
      errorMessage: { type: ["string", "null"] },
      walletTransactionId: { type: ["integer", "null"] },
      transferredAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    contract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: {
        from: "contractPayouts.contractId",
        to: "contracts.id",
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "contractPayouts.userId",
        to: "users.id",
      },
    },
    walletTransaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: WalletTransaction,
      join: {
        from: "contractPayouts.walletTransactionId",
        to: "walletTransactions.id",
      },
    },
  });
}

