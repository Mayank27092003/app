import { Model, RelationMappings } from "objection";
import { JobApplication } from "./jobApplications";

export class JobActivity extends Model {
    id!: number;
    jobApplicationId!: number;
    type!: "preTrip" | "postTrip";
    notes?: string;
    photoUrl?: string;
    createdAt?: string;
    deletedAt?: string | null;
  
    jobApplication?: JobApplication;
  
    static tableName = "jobActivities";
  
    static jsonSchema = {
      type: "object",
      required: ["jobApplicationId", "type"],
      properties: {
        id: { type: "integer" },
        jobApplicationId: { type: "integer" },
        type: { type: "string", enum: ["preTrip", "postTrip"] },
        notes: { type: ["string", "null"] },
        photoUrl: { type: ["string", "null"] },
        createdAt: { type: "string" },
        deletedAt: { type: ["string", "null"] },
      },
    };
  
    static relationMappings = (): RelationMappings => ({
      jobApplication: {
        relation: Model.BelongsToOneRelation,
        modelClass: JobApplication,
        join: {
          from: "jobActivities.jobApplicationId",
          to: "jobApplications.id",
        },
      },
    });
  }