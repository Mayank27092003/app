import { Model, RelationMappings } from "objection";
import { Company } from "./companies";
import { JobApplication } from "./jobApplications";
import { JobVisibilityRole } from "./jobVisibilityRole";
import { StripePayment } from "./stripePayment";
import { Conversation } from "./conversation";
import { Contract } from "./contracts";
import { Escrow } from "./escrow";

type Location = {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  lat: number;
  lng: number;
  date: string; // e.g. "2025-09-02"
  time: string; // e.g. "14:30"
};

type Cargo = {
  distance: number;               // in km/miles
  estimatedDuration: string;      // e.g. "2h 30m"
  cargoType: string;              // e.g. "electronics"
  cargoWeight: number;            // numeric value
  cargoWeightUnit: "kg" | "lbs" | "tons"; // unit
  requiredTruckTypeIds: number[]; // references truckTypes.id
};

export class Job extends Model {
  id!: number;
  userId!:number;
  companyId!: number;
  parentJobId?: number | null;
  title!: string;
  description?: string;
  payAmount!: number;
  jobType!: "short" | "long";
  status!: "draft" | "pending_funding" | "active" | "assigned" | "in_progress" | "completed" | "cancelled";
  assignmentType!: "auto" | "manual";
  startDate?: string;
  endDate?: string;
  tonuAmount?: number;
  isTonuEligible?: boolean;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  cargo?: Cargo;
  payoutStatus?: string;
  assignedDriverId?: number;
  assignedAt?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  specialRequirements?: string;

  company?: Company;
  jobApplications?: JobApplication[];
  visibilityRoles?: JobVisibilityRole[];
  stripePayments?: StripePayment[];
  conversation?: Conversation;
  escrow?:Escrow;

  static tableName = "jobs";

  static jsonSchema = {
    type: "object",
    required: ["companyId", "title", "jobType", "assignmentType"],
    properties: {
      id: { type: "integer" },
      companyId: { type: "integer" },
      userId: { type: "integer" },
      parentJobId: { type: ["integer", "null"] },
      title: { type: "string" },
      description: { type: ["string", "null"] },
      payAmount: { type: ["number", "null"] },
      jobType: { 
        type: "string", 
        enum: ["short", "long"]
      },
      status: {
        type: "string",
        enum: ["draft", "pending_funding", "active", "assigned", "in_progress", "completed", "cancelled"],
        default: "active"
      },
      assignmentType: {
        type: "string",
        enum: ["auto", "manual"],
        description: "auto: immediate assignment, manual: manual selection"
      },
      startDate: { type: ["string", "null"], format: "date-time" },
      endDate: { type: ["string", "null"], format: "date-time" },
      tonuAmount: { type: ["string", "null","number"] },
      isTonuEligible: { type: ["boolean", "null"] },

      pickupLocation: {
        type: ["object", "null"],
        properties: {
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          country: { type: "string" },
          zipCode: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          date: { type: "string", format: "date" },
          time: { type: "string" }
        },
        required: ["address", "city", "state", "country", "zipCode", "lat", "lng", "date", "time"],
        additionalProperties: false,
      },

      dropoffLocation: {
        type: ["object", "null"],
        properties: {
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          country: { type: "string" },
          zipCode: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          date: { type: "string", format: "date" },
          time: { type: "string" }
        },
        required: ["address", "city", "state", "country", "zipCode", "lat", "lng", "date", "time"],
        additionalProperties: false,
      },

      cargo: {
        type: ["object", "null"],
        properties: {
          distance: { type: "number" },
          estimatedDuration: { type: "string" },
          cargoType: { type: "string" },
          cargoWeight: { type: "number" },
          cargoWeightUnit: { 
            type: "string", 
            enum: ["kg", "lbs", "tons"] 
          },
          requiredTruckTypeIds: {
            type: "array",
            items: { type: "integer" },
            description: "IDs referencing truckTypes table"
          }
        },
        required: ["distance", "estimatedDuration", "cargoType", "cargoWeight", "cargoWeightUnit", "requiredTruckTypeIds"],
        additionalProperties: false,
      },

      payoutStatus: { type: ["string", "null"] },
      assignedDriverId: { type: ["integer", "null"] },
      assignedAt: { type: ["string", "null"] },
      contractStartDate: { type: ["string", "null"], format: "date-time" },
      contractEndDate: { type: ["string", "null"], format: "date-time" },
      specialRequirements: { type: ["string", "null"] },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: { from: "jobs.companyId", to: "companies.id" },
    },
    parentJob: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "jobs.parentJobId", to: "jobs.id" },
    },
    childJobs: {
      relation: Model.HasManyRelation,
      modelClass: Job,
      join: { from: "jobs.id", to: "jobs.parentJobId" },
    },
    jobApplications: {
      relation: Model.HasManyRelation,
      modelClass: JobApplication,
      join: { from: "jobs.id", to: "jobApplications.jobId" },
    },
    visibilityRoles: {
      relation: Model.HasManyRelation,
      modelClass: JobVisibilityRole,
      join: { from: "jobs.id", to: "jobVisibilityRoles.jobId" },
    },
    stripePayments: {
      relation: Model.HasManyRelation,
      modelClass: StripePayment,
      join: { from: "jobs.id", to: "stripePayments.jobId" },
    },
    conversation: {
      relation: Model.HasOneRelation,
      modelClass: Conversation,
      join: { from: "jobs.id", to: "conversations.jobId" },
    },
    contracts: {
      relation: Model.HasManyRelation,
      modelClass: Contract,
      join: { from: "jobs.id", to: "contracts.jobId" },
    },
    escrow: {
      relation: Model.HasOneRelation,
      modelClass: Escrow,
      join: { from: "jobs.id", to: "escrows.jobId" },
    },
  });

  /**
   * Find the root job by traversing the parentJobId chain
   * @param jobId - The job ID to start from
   * @param maxDepth - Maximum depth to prevent infinite loops (default: 10)
   * @returns The root job (job without parentJobId)
   */
  static async findRootJob(jobId: number, maxDepth: number = 10): Promise<Job | null> {
    let currentJob = await Job.query().findById(jobId);
    
    if (!currentJob) {
      return null;
    }

    const visitedJobIds = new Set<number>();
    let depth = 0;

    // Traverse up the chain until we find a job without parentJobId
    while (currentJob.parentJobId && depth < maxDepth) {
      // Check for circular reference
      if (visitedJobIds.has(currentJob.parentJobId)) {
        console.warn(`Circular reference detected in job hierarchy at job ${currentJob.id}`);
        break; // Return current job as root to prevent infinite loop
      }

      visitedJobIds.add(currentJob.id);
      
      const parentJob = await Job.query().findById(currentJob.parentJobId);
      if (!parentJob) {
        break; // Parent job not found, return current job as root
      }
      
      currentJob = parentJob;
      depth++;
    }

    // If we hit max depth, log warning and return current job
    if (depth >= maxDepth) {
      console.warn(`Maximum depth (${maxDepth}) reached while finding root job for job ${jobId}`);
    }

    return currentJob;
  }

  /**
   * Utility method to detect and fix circular references in job hierarchy
   * This should be run as a maintenance task if needed
   */
  static async detectAndFixCircularReferences(): Promise<{ detected: number; fixed: number }> {
    const allJobs = await Job.query().select('id', 'parentJobId');
    const visited = new Set<number>();
    const circularJobs = new Set<number>();
    let detected = 0;
    let fixed = 0;

    for (const job of allJobs) {
      if (visited.has(job.id)) continue;
      
      const path = new Set<number>();
      let currentJob = job;
      
      // Follow the chain
      while (currentJob && currentJob.parentJobId) {
        if (path.has(currentJob.id)) {
          // Circular reference detected
          detected++;
          circularJobs.add(currentJob.id);
          break;
        }
        
        if (visited.has(currentJob.id)) break;
        
        path.add(currentJob.id);
        visited.add(currentJob.id);
        
        const nextJob = allJobs.find(j => j.id === currentJob.parentJobId);
        if (!nextJob) break;
        currentJob = nextJob;
      }
    }

    // Fix circular references by setting parentJobId to null
    for (const jobId of circularJobs) {
      await Job.query()
        .patch({ parentJobId: null })
        .where({ id: jobId });
      fixed++;
    }

    return { detected, fixed };
  }
}
