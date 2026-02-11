import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Job } from "./job";

export class Company extends Model {
    id!: number;
    userId!: number;
    companyName!: string;
    industryType?: string;
    contactNumber?: string;
    phoneNumber?: string; // Direct phone number for the company
    address?: string; // Street address
    country?: string; // Country name
    state?: string; // State/province name
    city?: string; // City name
    zipCode?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  
    user?: User;
    jobs?: Job[];
  
    static tableName = "companies";
  
    static jsonSchema = {
      type: "object",
      required: ["userId", "companyName"],
      properties: {
        id: { type: "integer" },
        userId: { type: "integer" },
        companyName: { type: "string" },
        industryType: { type: ["string", "null"] },
        contactNumber: { type: ["string", "null"] },
        phoneNumber: { type: ["string", "null"] },
        address: { type: ["string", "null"] },
        country: { type: ["string", "null"] },
        state: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        zipCode: { type: ["string", "null"] },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
        deletedAt: { type: ["string", "null"] },
      },
    };
  
    static relationMappings = (): RelationMappings => ({
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: "companies.userId", to: "users.id" },
      },
      jobs: {
        relation: Model.HasManyRelation,
        modelClass: Job,
        join: { from: "companies.id", to: "jobs.companyId" },
      },
    });
  }