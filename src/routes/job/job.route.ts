import { JobController } from "../../controllers/job";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import { requireVerification } from "../../middlewares/requireVerification";
import { useValidator } from "../../middlewares/validate";
import { createJobSchema, createContractSchema } from "../../validators/job.schema";

const controller = new JobController();

export default [
  // Create a new job (Shipper/Company)
  {
    path: "/",
    controller: { post: controller.createJob },
    validators: { post: useValidator(createJobSchema) },
    middlewares: {
      post: [
        authenticateToken,
        // requireRole(["shipper", "company", "admin"]),
        requireVerification("documents_verified"),
      ],
    },
    docs: {
      post: {
        summary: "Create a new job",
        tags: ["Jobs"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "title",
                  "payAmount",
                  "jobType",
                  "assignmentType",
                  "visibleToRoles",
                  "startDate",
                  "endDate",
                  "pickupLocation",
                  "dropoffLocation",
                  "truckTypeId",
                ],
                properties: {
                  title: { type: "string", description: "Job title" },
                  description: {
                    type: "string",
                    description: "Job description",
                  },
                  payAmount: { type: "number", description: "Payment amount" },
                  jobType: {
                    type: "string",
                    enum: ["short", "long"],
                    description:
                      "short: auto-assign like Uber, long: manual assign like Upwork",
                  },
                  assignmentType: {
                    type: "string",
                    enum: ["auto", "manual"],
                    description:
                      "auto: immediate assignment, manual: manual selection",
                  },
                  startDate: {
                    type: "string",
                    format: "date",
                    description: "Job start date",
                    example: "2025-09-05T08:30:00Z",
                  },
                  endDate: {
                    type: "string",
                    format: "date",
                    description: "Job end date",
                    example: "2025-10-30T08:30:00Z",
                  },

                  tonuAmount: { type: "number", description: "TONU amount" },
                  isTonuEligible: {
                    type: "boolean",
                    description: "Whether TONU is eligible",
                  },

                  pickupLocation: {
                    type: "object",
                    properties: {
                      address: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      country: { type: "string" },
                      zipCode: { type: "string" },
                      lat: { type: "number" },
                      lng: { type: "number" },
                      date: { type: "string", format: "date" },
                      time: { type: "string" },
                    },
                    required: ["address", "lat", "lng"],
                  },
                  dropoffLocation: {
                    type: "object",
                    properties: {
                      address: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      country: { type: "string" },
                      zipCode: { type: "string" },
                      lat: { type: "number" },
                      lng: { type: "number" },
                      date: { type: "string", format: "date" },
                      time: { type: "string" },
                    },
                    required: ["address", "lat", "lng"],
                  },

                  cargo: {
                    type: "object",
                    description: "Cargo details",
                    properties: {
                      distance: { type: "number" },
                      estimatedDuration: { type: "string" },
                      cargoType: { type: "string" },
                      cargoWeight: { type: "number" },
                      cargoWeightUnit: {
                        type: "string",
                        enum: ["kg", "lbs", "tons"],
                      },
                      requiredTruckTypeIds: {
                        type: "array",
                        items: { type: "integer" },
                        description: "IDs referencing truckTypes table",
                        example: [1],
                      },
                    },
                  },
                  specialRequirements: {
                    type: "string",
                    description: "Special requirements for cargo handling",
                  },

                  visibleToRoles: {
                    type: "array",
                    items: { type: "integer" },
                    description: "Role IDs that can see this job",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Job created successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Get visible jobs (all authenticated users)
  {
    path: "/",
    controller: { get: controller.getVisibleJobs },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get jobs visible to the authenticated user",
        tags: ["Jobs"],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              oneOf: [
                {
                  type: "string",
                  enum: [
                    "draft",
                    "active",
                    "assigned",
                    "in_progress",
                    "completed",
                    "cancelled",
                    "partially_completed",
                  ],
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "draft",
                      "active",
                      "assigned",
                      "in_progress",
                      "completed",
                      "cancelled",
                      "partially_completed",
                    ],
                  },
                },
              ],
            },
            description: "Filter by job status (single value, array",
            style: "form",
            explode: true,
          },
          {
            name: "jobType",
            in: "query",
            schema: { type: "string", enum: ["short", "long"] },
            description: "Filter by job type",
          },
          {
            name: "minPay",
            in: "query",
            schema: { type: "number" },
            description: "Minimum payment amount",
          },
          {
            name: "maxPay",
            in: "query",
            schema: { type: "number" },
            description: "Maximum payment amount",
          },
          {
            name: "location",
            in: "query",
            schema: { type: "string" },
            description: "Location filter (city, state, or address)",
          },
          {
            name: "showNearby",
            in: "query",
            schema: { type: "number" },
            description: "Radius in km/miles to search nearby jobs",
          },
          {
            name: "lat",
            in: "query",
            schema: { type: "number", format: "float" },
            description: "Latitude for nearby search",
          },
          {
            name: "lng",
            in: "query",
            schema: { type: "number", format: "float" },
            description: "Longitude for nearby search",
          },
          {
            name: "isMine",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter jobs created by the requesting user",
          },
          {
            name: "truckTypeIds",
            in: "query",
            schema: { type: "string", example: "4-5-6" },
            description:
              "Filter jobs by required truck type IDs (dash-separated list)",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, example: 1 },
            description: "Page number (for pagination, starts at 1)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
            description: "Number of jobs per page",
          },
          {
            name: "roleId",
            in: "query",
            schema: { type: "integer" },
            description: "Filter jobs by role ID (admin only - filters jobs visible to this role)",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search jobs. If search contains #number (e.g., #12 or %2312), searches by job ID or parent job ID. Otherwise, performs fuzzy search on job title. Note: # is URL-encoded as %23, but both formats are supported.",
            example: "#12 or 'delivery job'",
          },
        ],

        responses: {
          200: { description: "Jobs retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },


  // Assign job to driver
  // Removed: assignments are deprecated in favor of application -> contract flow

  // Removed: auto-assign deprecated

  // Create job contract (pending; starts when accepted)
  {
    path: "/:id/contracts",
    controller: { post: controller.createContract },
    validators: { post: useValidator(createContractSchema) },
    middlewares: {
      post: [
        authenticateToken,
        requireRole(["shipper", "broker", "carrier", "admin"]),
      ],
    },
    docs: {
      post: {
        summary: "Create a pending contract for a job",
        tags: ["Jobs", "Contracts"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: { 201: { description: "Contract created (pending)" } },
      },
    },
  },

  // Update job status
  {
    path: "/:id/status",
    controller: { patch: controller.updateJobStatus },
    middlewares: {
      patch: [authenticateToken, requireRole(["shipper", "company", "admin"])],
    },
    docs: {
      patch: {
        summary: "Update job status",
        tags: ["Jobs"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
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
              },
            },
          },
        },
        responses: {
          200: { description: "Job status updated successfully" },
          400: { description: "Bad request - invalid status" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Update job (only if no applications and unassigned)
  {
    path: "/:id",
    controller: { patch: controller.updateJob, delete: controller.deleteJob },
    middlewares: {
      patch: [authenticateToken],
      delete: [authenticateToken],
    },
    docs: {
      patch: {
        summary: "Update job details (no applications, unassigned)",
        tags: ["Jobs"],
      },
      delete: {
        summary: "Delete job (no applications, unassigned)",
        tags: ["Jobs"],
      },
    },
  },

  // Get job assignments for company
  {
    path: "/assignments",
    controller: { get: controller.getJobAssignments },
    middlewares: {
      get: [
        authenticateToken,
      ],
    },
    docs: {
      get: {
        summary: "Get job assignments for the authenticated company",
        tags: ["Jobs", "Assignments"],
        responses: {
          200: { description: "Job assignments retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Reshare a job
  {
    path: "/:id/reshare",
    controller: { post: controller.reshareJob },
    middlewares: {
      post: [
        authenticateToken,
        // requireRole(["driver", "admin"]),
      ],
    },
    docs: {
      post: {
        summary: "Reshare a job with new price",
        tags: ["Jobs"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID to reshare",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["payAmount"],
                properties: {
                  payAmount: { 
                    type: "number", 
                    description: "New payment amount for the reshared job",
                    minimum: 0.01
                  },
                  visibleToRoles: {
                    type: "array",
                    items: { type: "integer" },
                    description: "Array of role IDs that can see this reshared job. If not provided, will copy from original job."
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Job reshared successfully" },
          400: { description: "Bad request - invalid job ID or pay amount" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - only assigned users or admins can reshare" },
          404: { description: "Job not found" },
        },
      },
    },
  },

  // Retry payment for existing job
  {
    path: "/:jobId/payment/retry",
    controller: { post: controller.retryPayment },
    middlewares: {
      post: [
        authenticateToken,
        // requireRole(["shipper", "company", "admin"]),
      ],
    },
    docs: {
      post: {
        summary: "Get or create payment session for an existing job",
        tags: ["Jobs"],
        description: "Retrieves existing valid payment session or creates a new one if expired/cancelled",
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID",
          },
        ],
        responses: {
          200: {
            description: "Payment session retrieved or created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        paymentUrl: { type: "string" },
                        sessionId: { type: "string" },
                        paymentIntentId: { type: "string" },
                        isReused: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid job ID or payment already completed" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - unauthorized to access this job" },
          404: { description: "Job not found" },
        },
      },
    },
  },

  // Get job statistics
  {
    path: "/stats",
    controller: { get: controller.getJobStats },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get job statistics",
        tags: ["Jobs"],
        description: "Returns total jobs count, active jobs count, completed jobs count, assigned/in-progress jobs count, and total payAmount",
        responses: {
          200: {
            description: "Job statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        totalJobs: { type: "integer", description: "Total number of jobs" },
                        activeJobs: { type: "integer", description: "Number of active jobs" },
                        completedJobs: { type: "integer", description: "Number of completed jobs" },
                        assignedAndInProgressJobs: { type: "integer", description: "Number of jobs with status 'assigned' or 'in_progress'" },
                        totalPayAmount: { type: "number", description: "Sum of all job payAmount values" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized - missing or invalid token" },
          500: { description: "Internal server error" },
        },
      },
    },
  },

  // Get job details
  {
    path: "/:id",
    controller: { get: controller.getJobDetails },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get detailed information about a specific job",
        tags: ["Jobs"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID",
          },
        ],
        responses: {
          200: { description: "Job details retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - access denied to this job" },
          404: { description: "Job not found" },
        },
      },
    },
  },
];
