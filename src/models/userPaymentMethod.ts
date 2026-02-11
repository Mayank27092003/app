import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { PaymentProvider } from "./paymentProvider";

export class UserPaymentMethod extends Model {
  id!: number;
  userId!: number;
  providerId!: number;
  externalMethodId!: string;
  type!: string;
  isDefault!: boolean;
  isActive!: boolean;
  createdAt?: string;
  updatedAt?: string;

  user?: User;
  provider?: PaymentProvider;

  static tableName = "userPaymentMethods";

  static jsonSchema = {
    type: "object",
    required: ["userId", "providerId", "externalMethodId", "type"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      providerId: { type: "integer" },
      externalMethodId: { type: "string" },
      type: { type: "string" },
      isDefault: { type: "boolean", default: false },
      isActive: { type: "boolean", default: true },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userPaymentMethods.userId", to: "users.id" },
    },
    provider: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentProvider,
      join: { from: "userPaymentMethods.providerId", to: "paymentProviders.id" },
    },
  });
}
