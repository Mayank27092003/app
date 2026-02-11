import { Model, RelationMappings } from "objection";

export class PaymentProvider extends Model {
  id!: number;
  name!: string;
  description?: string;
  isEnabled!: boolean;
  createdAt?: string;

  static tableName = "paymentProviders";

  static jsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      isEnabled: { type: "boolean", default: true },
      createdAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({});
}
