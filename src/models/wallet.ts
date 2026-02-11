import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { WalletTransaction } from "./walletTransaction";

export class Wallet extends Model {
  id!: number;
  userId!: number;
  availableBalance!: number;
  onHold!: number;
  updatedAt?: string;

  user?: User;
  transactions?: WalletTransaction[];

  static tableName = "wallets";

  static jsonSchema = {
    type: "object",
    required: ["userId"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      availableBalance: { type: "number", default: 0 },
      onHold: { type: "number", default: 0 },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "wallets.userId", to: "users.id" },
    },
    transactions: {
      relation: Model.HasManyRelation,
      modelClass: WalletTransaction,
      join: { from: "wallets.id", to: "walletTransactions.walletId" },
    },
  });
}
