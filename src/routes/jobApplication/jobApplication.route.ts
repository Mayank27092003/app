import { JobApplicationController } from "../../controllers/jobApplication";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import type { RouteDefinition } from "../types";

const controller = new JobApplicationController();

// Validation schemas
const applyForJobSchema = {
  type: "object",
  required: ["jobId"],
  properties: {
    jobId: { type: "integer" },
    coverLetter: { type: ["string", "null"], maxLength: 1000 },
    proposedRate: { type: ["number", "null"] },
    estimatedDuration: { type: ["string", "null"], maxLength: 100 },
    notes: { type: ["string", "null"], maxLength: 500 },
  },
  additionalProperties: false,
} as const;

const rejectApplicationSchema = {
  type: "object",
  properties: {
    reason: { type: ["string", "null"], maxLength: 500 },
  },
  additionalProperties: false,
} as const;

const jobApplicationRoutes: RouteDefinition[] = [
  {
    path: "/apply",
    controller: { post: controller.applyForJob },
    validators: { post: useValidator(applyForJobSchema) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Apply for a job",
        description:
          "Submit an application for a job. Auto-assignment if job.assignmentType is 'auto'",
        tags: ["Job Applications"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["jobId"],
                properties: {
                  jobId: { type: "integer", example: 1 },
                  coverLetter: {
                    type: ["string", "null"],
                    example: "I have 5 years experience...",
                  },
                  proposedRate: { type: ["number", "null"], example: 150.0 },
                  estimatedDuration: {
                    type: ["string", "null"],
                    example: "2 hours",
                  },
                  notes: {
                    type: ["string", "null"],
                    example: "Available immediately",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Application submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        jobId: { type: "integer", example: 1 },
                        driverId: { type: "integer", example: 1 },
                        status: { type: "string", example: "pending" },
                        appliedAt: { type: "string", format: "date-time" },
                      },
                    },
                    message: {
                      type: "string",
                      example: "Application submitted successfully",
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid input or job not available" },
          401: { description: "Unauthorized" },
        },
      },
    },
  },
  {
    path: "/my-applications",
    controller: { get: controller.getUserApplications },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get user's applications",
        description: "Get all applications submitted by the authenticated user",
        tags: ["Job Applications"],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "pending",
                "accepted",
                "rejected",
                "withdrawn",
                "completed",
              ],
            },
            description: "Filter applications by status",
            example: "pending",
          },
        ],
        responses: {
          200: {
            description: "Applications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          jobId: { type: "integer", example: 1 },
                          driverId: { type: "integer", example: 1 },
                          status: { type: "string", example: "pending" },
                          appliedAt: { type: "string", format: "date-time" },
                          job: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              title: {
                                type: "string",
                                example: "Delivery Job",
                              },
                              company: {
                                type: "object",
                                properties: {
                                  companyName: {
                                    type: "string",
                                    example: "ABC Logistics",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
  },
  {
    path: "/:applicationId",
    controller: { get: controller.getApplicationById },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get job applications (job owner only)",
        description: "Get all applications for a specific job",
        tags: ["Job Applications"],

        parameters: [
          {
            name: "applicationId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "pending",
                "accepted",
                "rejected",
                "withdrawn",
                "completed",
              ],
            },
            description: "Filter applications by status",
            example: "pending",
          },
        ],
        responses: {
          200: {
            description: "Applications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        jobId: { type: "integer", example: 1 },
                        driverId: { type: "integer", example: 1 },
                        status: { type: "string", example: "pending" },
                        appliedAt: { type: "string", format: "date-time" },
                        driver: {
                          type: "object",
                          properties: {
                            id: { type: "integer", example: 1 },
                            user: {
                              type: "object",
                              properties: {
                                fullName: {
                                  type: "string",
                                  example: "John Doe",
                                },
                                email: {
                                  type: "string",
                                  example: "john@example.com",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Access denied" },
        },
      },
    },
  },
  {
    path: "/job/:jobId",
    controller: { get: controller.getJobApplications },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get job applications (job owner only)",
        description: "Get all applications for a specific job",
        tags: ["Job Applications"],

        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Job ID",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "pending",
                "accepted",
                "rejected",
                "withdrawn",
                "completed",
              ],
            },
            description: "Filter applications by status",
            example: "pending",
          },
        ],
        responses: {
          200: {
            description: "Applications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          jobId: { type: "integer", example: 1 },
                          driverId: { type: "integer", example: 1 },
                          status: { type: "string", example: "pending" },
                          appliedAt: { type: "string", format: "date-time" },
                          driver: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              user: {
                                type: "object",
                                properties: {
                                  fullName: {
                                    type: "string",
                                    example: "John Doe",
                                  },
                                  email: {
                                    type: "string",
                                    example: "john@example.com",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Access denied" },
        },
      },
    },
  },
  {
    path: "/:applicationId/accept",
    controller: { post: controller.acceptApplication },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Accept an application (job owner only)",
        description: "Accept an application and assign the job to the driver",
        tags: ["Job Applications"],

        parameters: [
          {
            name: "applicationId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Application ID",
          },
        ],
        responses: {
          200: {
            description: "Application accepted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        jobId: { type: "integer", example: 1 },
                        driverId: { type: "integer", example: 1 },
                        status: { type: "string", example: "accepted" },
                        assignedAt: { type: "string", format: "date-time" },
                      },
                    },
                    message: {
                      type: "string",
                      example: "Application accepted and job assigned",
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid request or job already assigned" },
          401: { description: "Unauthorized" },
          403: { description: "Access denied" },
        },
      },
    },
  },
  {
    path: "/:applicationId/reject",
    controller: { post: controller.rejectApplication },
    validators: { post: useValidator(rejectApplicationSchema) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Reject an application (job owner only)",
        description: "Reject an application with optional reason",
        tags: ["Job Applications"],

        parameters: [
          {
            name: "applicationId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Application ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: {
                    type: ["string", "null"],
                    example: "Not suitable for this job",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Application rejected successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        status: { type: "string", example: "rejected" },
                        rejectedAt: { type: "string", format: "date-time" },
                      },
                    },
                    message: {
                      type: "string",
                      example: "Application rejected",
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid request" },
          401: { description: "Unauthorized" },
          403: { description: "Access denied" },
        },
      },
    },
  },
  {
    path: "/:applicationId/withdraw",
    controller: { post: controller.withdrawApplication },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Withdraw an application (applicant only)",
        description: "Withdraw a pending application",
        tags: ["Job Applications"],

        parameters: [
          {
            name: "applicationId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Application ID",
          },
        ],
        responses: {
          200: {
            description: "Application withdrawn successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        status: { type: "string", example: "withdrawn" },
                        withdrawnAt: { type: "string", format: "date-time" },
                      },
                    },
                    message: {
                      type: "string",
                      example: "Application withdrawn",
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid request or cannot withdraw" },
          401: { description: "Unauthorized" },
        },
      },
    },
  },
];

export default jobApplicationRoutes;
