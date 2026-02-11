import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Job } from "./job";

export class JobInvite extends Model {
  id!: number;
  jobId!: number;
  invitedUserId!: number;
  invitedByUserId!: number;
  status!: "invited" | "accepted" | "declined";
  message?: string | null;
  declineReason?: string | null;
  invitedAt?: string;
  respondedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Relations
  job?: Job;
  invitedUser?: User;
  invitedByUser?: User;

  static tableName = "jobInvites";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "invitedUserId", "invitedByUserId"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      invitedUserId: { type: "integer" },
      invitedByUserId: { type: "integer" },
      status: {
        type: "string",
        enum: ["invited", "accepted", "declined"],
        default: "invited",
      },
      message: { type: ["string", "null"] },
      declineReason: { type: ["string", "null"] },
      invitedAt: { type: ["string", "null"] },
      respondedAt: { type: ["string", "null"] },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: {
        from: "jobInvites.jobId",
        to: "jobs.id",
      },
    },
    invitedUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "jobInvites.invitedUserId",
        to: "users.id",
      },
    },
    invitedByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "jobInvites.invitedByUserId",
        to: "users.id",
      },
    },
  });
}

