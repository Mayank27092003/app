import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { PaymentProvider } from "./paymentProvider";

export class UserBankAccount extends Model {
  id!: number;
  userId!: number;
  providerId!: number;
  externalBankId!: string;
  bankName?: string;
  last4?: string;
  country?: string;
  currency?: string;
  isDefault!: boolean;
  isVerified!: boolean;
  isActive!: boolean;
  createdAt?: string;
  updatedAt?: string;

  user?: User;
  provider?: PaymentProvider;

  static tableName = "userBankAccounts";

  static jsonSchema = {
    type: "object",
    required: ["userId", "providerId", "externalBankId"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      providerId: { type: "integer" },
      externalBankId: { type: "string" },
      bankName: { type: ["string", "null"] },
      last4: { type: ["string", "null"] },
      country: { type: ["string", "null"] },
      currency: { type: ["string", "null"] },
      isDefault: { type: "boolean", default: false },
      isVerified: { type: "boolean", default: false },
      isActive: { type: "boolean", default: true },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userBankAccounts.userId", to: "users.id" },
    },
    provider: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentProvider,
      join: { from: "userBankAccounts.providerId", to: "paymentProviders.id" },
    },
  });
}
