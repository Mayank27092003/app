import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Driver } from "./drivers";

export class StripeTransfer extends Model {
  id!: number;
  jobId!: number;
  driverId!: number;
  amount!: number;
  stripeTransferId!: string;
  status!: "pending" | "succeeded" | "failed";
  createdAt?: string;
  updatedAt?: string;

  job?: Job;
  driver?: Driver;

  static tableName = "StripeTransfers";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "driverId", "amount", "stripeTransferId"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      driverId: { type: "integer" },
      amount: { type: "number" },
      stripeTransferId: { type: "string" },
      status: { type: "string", enum: ["pending", "succeeded", "failed"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "StripeTransfers.jobId", to: "jobs.id" },
    },
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: Driver,
      join: { from: "StripeTransfers.driverId", to: "drivers.id" },
    },
  });
}
