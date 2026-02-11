import { JSONSchemaType } from "ajv";

export interface CreateJobRequest {
  title: string;
  description?: string;
  payAmount: number;
  jobType: "short" | "long";
  assignmentType: "auto" | "manual";
  startDate?: string;
  endDate?: string;
  tonuAmount?: number;
  isTonuEligible?: boolean;
  pickupLocation?: {
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
  dropoffLocation?: {
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
  visibleToRoles: number[];
  cargo?: {
    distance: number; // in km/miles
    estimatedDuration: string; // e.g. "2h 30m"
    cargoType: string; // e.g. "electronics"
    cargoWeight: number; // numeric value
    cargoWeightUnit: "kg" | "lbs" | "tons"; // unit
    requiredTruckTypeIds: number[]; // references truckTypes.id
  };
  specialRequirements?:string;
}

export interface AssignJobRequest {
  driverId: number;
  assignmentType: "auto" | "manual" | "direct";
  notes?: string;
}

export interface CreateContractRequest {
  driverId: number;
  contractAmount: number;
  startDate?: string;
  endDate?: string;
  terms?: string;
  milestones?: any[];
  paymentSchedule?: any[];
}

export interface UpdateJobStatusRequest {
  status:
    | "draft"
    | "active"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
}

export const createJobSchema: JSONSchemaType<CreateJobRequest> = {
  type: "object",
  required: [
    "title",
    "payAmount",
    "jobType",
    "assignmentType",
    "visibleToRoles",
  ],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 200,
      description: "Job title",
    },
    description: {
      type: "string",
      maxLength: 2000,
      nullable: true,
      description: "Job description",
    },
    payAmount: {
      type: "number",
      minimum: 0,
      description: "Payment amount",
    },
    jobType: {
      type: "string",
      enum: ["short", "long"],
      description: "Job type: short (auto-assign) or long (manual assign)",
    },
    assignmentType: {
      type: "string",
      enum: ["auto", "manual"],
      description: "Assignment type: auto (immediate) or manual (selection)",
    },
    startDate: {
      type: "string",
      format: "date-time",
      nullable: true,
      description: "Job start date",
    },
    endDate: {
      type: "string",
      format: "date-time",
      nullable: true,
      description: "Job end date",
    },
    tonuAmount: {
      type: "number",
      minimum: 0,
      nullable: true,
      description: "TONU amount",
    },
    isTonuEligible: {
      type: "boolean",
      nullable: true,
      description: "Whether TONU is eligible",
    },
    pickupLocation: {
      type: "object",
      nullable: true,
      properties: {
        address: { type: "string", minLength: 1 },
        city: { type: "string", minLength: 1 },
        state: { type: "string", minLength: 1 },
        country: { type: "string", minLength: 1 },
        zipCode: { type: "string", minLength: 1 },
        lat: { type: "number" },
        lng: { type: "number" },
        date: { type: "string", format: "date" },
        time: { type: "string" },
      },
      required: [
        "address",
        "city",
        "state",
        "country",
        "zipCode",
        "lat",
        "lng",
        "date",
        "time",
      ],
      additionalProperties: false,
    },
    dropoffLocation: {
      type: "object",
      nullable: true,
      properties: {
        address: { type: "string", minLength: 1 },
        city: { type: "string", minLength: 1 },
        state: { type: "string", minLength: 1 },
        country: { type: "string", minLength: 1 },
        zipCode: { type: "string", minLength: 1 },
        lat: { type: "number" },
        lng: { type: "number" },
        date: { type: "string", format: "date" },
        time: { type: "string" },
      },
      required: [
        "address",
        "city",
        "state",
        "country",
        "zipCode",
        "lat",
        "lng",
        "date",
        "time",
      ],
      additionalProperties: false,
    },
    cargo: {
      type: "object",
      nullable: true,
      properties: {
        distance: { type: "number" },
        estimatedDuration: { type: "string" },
        cargoType: { type: "string" },
        cargoWeight: { type: "number" },
        cargoWeightUnit: { type: "string", enum: ["kg", "lbs", "tons"] },
        requiredTruckTypeIds: {
          type: "array",
          items: { type: "integer" },
        },
      },
      required: [
        "distance",
        "estimatedDuration",
        "cargoType",
        "cargoWeight",
        "cargoWeightUnit",
        "requiredTruckTypeIds",
      ],
      additionalProperties: false,
    },
    specialRequirements: {
      type: "string",
      nullable: true,
      maxLength: 2000,
      description: "Additional notes or requirements",
    },
    visibleToRoles: {
      type: "array",
      items: { type: "integer"},
      description: "Role IDs that can see this job",
    },
  },
  additionalProperties: false,
};

export const assignJobSchema: JSONSchemaType<AssignJobRequest> = {
  type: "object",
  required: ["driverId", "assignmentType"],
  properties: {
    driverId: {
      type: "integer",
      minimum: 1,
      description: "Driver ID to assign",
    },
    assignmentType: {
      type: "string",
      enum: ["auto", "manual", "direct"],
      description: "Type of assignment",
    },
    notes: {
      type: "string",
      maxLength: 1000,
      nullable: true,
      description: "Assignment notes",
    },
  },
  additionalProperties: false,
};

export const createContractSchema: JSONSchemaType<CreateContractRequest> = {
  type: "object",
  required: ["driverId", "contractAmount"],
  properties: {
    driverId: {
      type: "integer",
      minimum: 1,
      description: "Driver ID",
    },
    contractAmount: {
      type: "number",
      minimum: 0,
      description: "Contract amount",
    },
    startDate: {
      type: "string",
      format: "date",
      nullable: true,
      description: "Contract start date",
    },
    endDate: {
      type: "string",
      format: "date",
      nullable: true,
      description: "Contract end date",
    },
    terms: {
      type: "string",
      maxLength: 5000,
      nullable: true,
      description: "Contract terms",
    },
    milestones: {
      type: "array",
      items: { type: "object" },
      nullable: true,
      description: "Milestone tracking",
    },
    paymentSchedule: {
      type: "array",
      items: { type: "object" },
      nullable: true,
      description: "Payment schedule",
    },
  },
  additionalProperties: false,
};

export const updateJobStatusSchema: JSONSchemaType<UpdateJobStatusRequest> = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: [
        "draft",
        "active",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      description: "New job status",
    },
  },
  additionalProperties: false,
};
