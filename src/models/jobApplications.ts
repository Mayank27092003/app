import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Driver } from "./drivers";
import { JobActivity } from "./jobActivity";
import { Contract } from "./contracts";
import { Conversation } from "./conversation";
import { User } from "./users";

export class JobApplication extends Model {
  id!: number;
  jobId!: number;
  applicantUserId!: number;
  driverId?: number;
  conversationId?: number;
  status!: "pending" | "accepted" | "rejected" | "withdrawn" | "completed";
  coverLetter?: string;
  proposedRate?: number;
  estimatedDuration?: string;
  notes?: string;
  appliedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  job?: Job;
  driver?: Driver;
  jobActivities?: JobActivity[];

  static tableName = "jobApplications";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "applicantUserId"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      applicantUserId: { type: "integer" },
      driverId: { type: ["integer", "null"] },
      conversationId: { type: ["integer", "null"] },
      status: {
        type: "string",
        enum: ["pending", "accepted", "rejected", "withdrawn", "completed"],
      },
      coverLetter: { type: ["string", "null"] },
      proposedRate: { type: ["number", "null"] },
      estimatedDuration: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
      appliedAt: { type: ["string", "null"] },
      acceptedAt: { type: ["string", "null"] },
      rejectedAt: { type: ["string", "null"] },
      withdrawnAt: { type: ["string", "null"] },
      rejectionReason: { type: ["string", "null"] },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "jobApplications.jobId", to: "jobs.id" },
    },
    applicant: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "jobApplications.applicantUserId", to: "users.id" },
    },
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: Driver,
      join: { from: "jobApplications.driverId", to: "drivers.id" },
    },
    jobActivities: {
      relation: Model.HasManyRelation,
      modelClass: JobActivity,
      join: {
        from: "jobApplications.id",
        to: "jobActivities.jobApplicationId",
      },
    },
    contracts: {
      relation: Model.HasManyRelation,
      modelClass: Contract,
      join: { from: "jobApplications.id", to: "contracts.jobApplicationId" },
    },
    conversations: {
      relation: Model.HasManyRelation,
      modelClass: Conversation,
      join: { from: "jobApplications.conversationId", to: "conversations.id" },
    },
  });
}
