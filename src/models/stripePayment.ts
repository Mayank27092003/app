import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Company } from "./companies";
import { Driver } from "./drivers";

export class StripePayment extends Model {
  id!: number;
  jobId!: number;
  companyId!: number;
  baseAmount!: number;
  companyCommission!: number;
  driverCommission!: number;
  totalAmount!: number;
  stripePaymentIntentId!: string | null;
  stripeCheckoutSessionId!: string | null;
  status!: "pending" | "succeeded" | "failed";
  createdAt?: string;
  updatedAt?: string;

  job?: Job;
  company?: Company;

  static tableName = "StripePayments";

  static jsonSchema = {
    type: "object",
    required: [
      "jobId",
      "companyId",
      "baseAmount",
      "companyCommission",
      "driverCommission",
      "totalAmount",
    ],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      companyId: { type: "integer" },
      baseAmount: { type: "number" },
      companyCommission: { type: "number" },
      driverCommission: { type: "number" },
      totalAmount: { type: "number" },
      stripePaymentIntentId: { type: ["string", "null"] },
      stripeCheckoutSessionId: { type: ["string", "null"] },
      status: { type: "string", enum: ["pending", "succeeded", "failed"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "StripePayments.jobId", to: "jobs.id" },
    },
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: { from: "StripePayments.companyId", to: "companies.id" },
    },
  });
}
