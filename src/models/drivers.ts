import { Model, RelationMappingsThunk } from "objection";
import { User } from "./users";
import { JobApplication } from "./jobApplications";
import { Document } from "./document";

export class Driver extends Model {
    static tableName = "drivers";
  
    // Type declarations
    id!: number;
    userId!: number;
    licenseNumber!: string;
    twicNumber?: string;
    medicalCertificate?: string;
    drugTestResult?: string;
    verified?: boolean;
    workRadius?: number;
    drivingLicenseExpiresAt?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  
    user?: User;
    documents?: Document[];
    jobApplications?: JobApplication[];
  
    static jsonSchema = {
      type: "object",
      required: ["userId", "licenseNumber"],
      properties: {
        id: { type: "integer" },
        userId: { type: "integer" },
        licenseNumber: { type: "string" },
        twicNumber: { type: ["string", "null"] },
        medicalCertificate: { type: ["string", "null"] },
        drugTestResult: { type: ["string", "null"] },
        verified: { type: "boolean" },
        workRadius: { type: ["integer", "null"] },
        drivingLicenseExpiresAt: { type: ["string", "null"] },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
        deletedAt: { type: ["string", "null"] },
      },
    };
  
    static relationMappings: RelationMappingsThunk = () => ({
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: "drivers.userId", to: "users.id" },
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: { from: "drivers.id", to: "documents.driverId" },
      },
      jobApplications: {
        relation: Model.HasManyRelation,
        modelClass: JobApplication,
        join: { from: "drivers.id", to: "jobApplications.driverId" },
      },
    });
  }
  