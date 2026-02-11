import { Model, RelationMappings } from "objection";
import { Driver } from "./drivers";
import { Company } from "./companies";
import { User } from "./users";

export class StripeAccount extends Model {
  id!: number;
  userId?: number;
  companyId?: number;
  driverId?: number;
  stripeAccountId!: string;
  accountType!: "individual" | "company";
  isVerified!: boolean;
  isActive!: boolean;
  capabilities?: string; // JSON string for Stripe capabilities
  chargesEnabled!: boolean;
  payoutsEnabled!: boolean;
  requirements?: string; // JSON string for Stripe requirements
  createdAt?: string;
  updatedAt?: string;

  user?: User;
  company?: Company;
  driver?: Driver;

  static tableName = "stripeAccounts";

  static jsonSchema = {
    type: "object",
    required: ["stripeAccountId", "accountType", "isVerified", "isActive", "chargesEnabled", "payoutsEnabled"],
    properties: {
      id: { type: "integer" },
      userId: { type: ["integer", "null"] },
      companyId: { type: ["integer", "null"] },
      driverId: { type: ["integer", "null"] },
      stripeAccountId: { type: "string" },
      accountType: { 
        type: "string", 
        enum: ["individual", "company"],
        description: "Type of Stripe account"
      },
      isVerified: { type: "boolean" },
      isActive: { type: "boolean" },
      capabilities: { type: ["string", "null"] },
      chargesEnabled: { type: "boolean" },
      payoutsEnabled: { type: "boolean" },
      requirements: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "stripeAccounts.userId", to: "users.id" },
    },
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: { from: "stripeAccounts.companyId", to: "companies.id" },
    },
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: Driver,
      join: { from: "stripeAccounts.driverId", to: "drivers.id" },
    },
  });
}
