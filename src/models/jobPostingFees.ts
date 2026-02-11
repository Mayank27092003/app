import { Model } from "objection";
import { Role } from "./roles";
import { Job } from "./job";

export class JobPostingFee extends Model {
  id!: number;
  jobId!: number;
  chargedByRoleId?: number;
  amount!: number;
  chargedAt?: string;

  static tableName = "jobPostingFees";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "amount"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      chargedByRoleId: { type: "integer" },
      amount: { type: "number" },
      chargedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = {
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "jobPostingFees.jobId", to: "jobs.id" },
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "jobPostingFees.chargedByRoleId", to: "roles.id" },
    },
  };
}
