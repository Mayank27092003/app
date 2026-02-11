import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Escrow } from "./escrow";
import { SubContract } from "./subContract";
import { ContractParticipant } from "./contractParticipants";
import { JobApplication } from "./jobApplications";
import { User } from "./users";
import { TripInspection } from "./tripInspection";

export class Contract extends Model {
  id!: number;
  jobId!: number;
  jobApplicationId?: number | null; // ✅ Must exist here
  parentContractId?: number | null; // null => root contract
  hiredByUserId!: number;
  hiredUserId!: number;
  billingCycle?: string | null;

  amount!: number;
  status!: "active" | "completed" | "cancelled";
  platformCommissionPercent?: number | null;
  platformCommissionAmount?: number | null;
  commissionType?: "percentage" | "fixed_amount" | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt!: string;
  updatedAt!: string;

  job?: Job;
  escrow?: Escrow;
  parentContract?: Contract;
  childContracts?: Contract[];
  subContracts?: SubContract[];
  hiredByUser?: User;
  hiredUser?: User;

  static tableName = "contracts";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "hiredByUserId", "hiredUserId", "amount", "status"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      parentContractId: { type: ["integer", "null"] },
      hiredByUserId: { type: "integer" },
      hiredUserId: { type: "integer" },
      amount: { type: "number" },
      status: { type: "string", enum: ["active", "completed", "cancelled"] },
      platformCommissionPercent: { type: ["number", "null"] },
      platformCommissionAmount: { type: ["number", "null"] },
      commissionType: {
        type: ["string", "null"],
        enum: ["percentage", "fixed_amount"],
      },
      startDate: { type: ["string", "null"], format: "date-time" },
      endDate: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "contracts.jobId", to: "jobs.id" },
    },
    jobApplication: {
      relation: Model.BelongsToOneRelation,
      modelClass: JobApplication,
      join: {
        from: "contracts.jobApplicationId",
        to: "jobApplications.id",
      },
    },
    escrow: {
      relation: Model.HasOneRelation,
      modelClass: Escrow,
      join: { from: "contracts.id", to: "escrows.contractId" },
    },
    parentContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "contracts.parentContractId", to: "contracts.id" },
    },
    childContracts: {
      relation: Model.HasManyRelation,
      modelClass: Contract,
      join: { from: "contracts.id", to: "contracts.parentContractId" },
    },
    subContracts: {
      relation: Model.HasManyRelation,
      modelClass: SubContract,
      join: { from: "contracts.id", to: "subContracts.rootContractId" },
    },
    // 👇 This is the missing relation that caused your error
    contractParticipants: {
      relation: Model.HasManyRelation,
      modelClass: ContractParticipant,
      join: {
        from: "contracts.id",
        to: "contractParticipants.contractId",
      },
    },
    hiredByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "contracts.hiredByUserId", to: "users.id" },
    },
    hiredUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "contracts.hiredUserId", to: "users.id" },
    },
    tripInspections: {
      relation: Model.HasManyRelation,
      modelClass: TripInspection,
      join: { from: "contracts.id", to: "tripInspections.contractId" },
    },
  });

  // 👇 Runtime helper to compute net earnings dynamically
  async computeNetEarnings() {
    const subContracts = await this.$relatedQuery("subContracts");
    const totalSubcontractCost = subContracts.reduce(
      (sum, s) => sum + (s.splitAmount || 0),
      0
    );
    const platformFee = this.platformCommissionAmount || (this.amount * 2) / 100; ;
    const grossAmount = this.amount || 0;
    const net = grossAmount - totalSubcontractCost - platformFee;
    return {
      gross: grossAmount,
      subcontractDeductions: totalSubcontractCost,
      platformFee,
      netEarning: net < 0 ? 0 : net,
    };
  }
}
