import { Model } from "objection";
import { Role } from "./roles";
import { Job } from "./job";

export class JobVisibilityRole extends Model {
  id!: number;
  jobId!: number;
  roleId!: number;
  sortOrder!: number;

  static tableName = "jobVisibilityRoles";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "roleId"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      roleId: { type: "integer" },
      sortOrder: { type: "integer", default: 0 },
    },
  };

  static relationMappings = {
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "jobVisibilityRoles.jobId", to: "jobs.id" },
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "jobVisibilityRoles.roleId", to: "roles.id" },
    },
  };
}
