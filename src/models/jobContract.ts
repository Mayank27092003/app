import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { User } from "./users";
import { Company } from "./companies";
import { Escrow } from "./escrow";

export class JobContract extends Model {
  id!: number;
  jobId!: number;
  driverId!: number;
  companyId!: number;
  contractNumber!: string;
  status!: "draft" | "pending" | "active" | "completed" | "cancelled";
  contractAmount!: number;
  startDate?: Date;
  endDate?: Date;
  terms?: string;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  job?: Job;
  driver?: User;
  company?: Company;
  escrow?: Escrow;

  static get tableName(): string {
    return "contracts";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["jobId", "driverId", "companyId", "contractNumber", "status", "contractAmount"],
      properties: {
        id: { type: "integer" },
        jobId: { type: "integer" },
        driverId: { type: "integer" },
        companyId: { type: "integer" },
        contractNumber: { type: "string", minLength: 1 },
        status: { 
          type: "string", 
          enum: ["draft", "pending", "active", "completed", "cancelled"]
        },
        contractAmount: { type: "number", minimum: 0 },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        terms: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      job: {
        relation: Model.BelongsToOneRelation,
        modelClass: Job,
        join: {
          from: "contracts.jobId",
          to: "jobs.id"
        }
      },
      driver: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "contracts.driverId",
          to: "users.id"
        }
      },
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: Company,
        join: {
          from: "contracts.companyId",
          to: "companies.id"
        }
      },
      escrow: {
        relation: Model.HasOneRelation,
        modelClass: Escrow,
        join: {
          from: "contracts.id",
          to: "escrows.contractId"
        }
      }
    };
  }
}
