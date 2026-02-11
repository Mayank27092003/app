import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Driver } from "./drivers";
import { Company } from "./companies";

export class JobAssignment extends Model {
  id!: number;
  jobId!: number;
  driverId!: number;
  assignedByCompanyId!: number;
  assignmentType!: "auto" | "manual" | "direct";
  status!: "pending" | "accepted" | "rejected" | "started" | "completed" | "cancelled";
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  job?: Job;
  driver?: Driver;
  assignedByCompany?: Company;

  static tableName = "jobAssignments";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "driverId", "assignedByCompanyId", "assignmentType", "status"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      driverId: { type: "integer" },
      assignedByCompanyId: { type: "integer" },
      assignmentType: { 
        type: "string", 
        enum: ["auto", "manual", "direct"],
        description: "auto: system assigned, manual: admin assigned, direct: direct assignment"
      },
      status: {
        type: "string",
        enum: ["pending", "accepted", "rejected", "started", "completed", "cancelled"],
        default: "pending"
      },
      assignedAt: { type: ["string", "null"] },
      acceptedAt: { type: ["string", "null"] },
      startedAt: { type: ["string", "null"] },
      completedAt: { type: ["string", "null"] },
      cancelledAt: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "jobAssignments.jobId", to: "jobs.id" },
    },
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: Driver,
      join: { from: "jobAssignments.driverId", to: "drivers.id" },
    },
    assignedByCompany: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: { from: "jobAssignments.assignedByCompanyId", to: "companies.id" },
    },
  });
}
