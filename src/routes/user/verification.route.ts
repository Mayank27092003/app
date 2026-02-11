import { UserVerificationController } from "../../controllers/user/verification.controller";
import { useValidator } from "../../middlewares/validate";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import {
  updateUserVerificationStatusSchema,
  checkVerificationRequirementsSchema,
  getPendingVerificationsSchema,
} from "../../validators/user.schema";
import type { RouteDefinition } from "../types";

const controller = new UserVerificationController();

const verificationRoutes: RouteDefinition[] = [
  {
    path: "/verification/status",
    controller: { get: controller.getMyVerificationStatus },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get user verification status",
        description:
          "Get the current verification status and progress for the authenticated user",
        tags: ["User Verification"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Verification status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        userId: { type: "integer", example: 1 },
                        currentStatus: {
                          type: "string",
                          example: "profile_complete",
                        },
                        lastUpdated: { type: "string", format: "date-time" },
                        verificationNotes: { type: ["string", "null"] },
                        isFullyVerified: { type: "boolean", example: false },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              step: {
                                type: "string",
                                example: "Email Verification",
                              },
                              status: { type: "string", example: "completed" },
                              completedAt: {
                                type: ["string", "null"],
                                format: "date-time",
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
    path: "/verification/check-requirements",
    controller: { post: controller.checkVerificationRequirements },
    validators: { post: useValidator(checkVerificationRequirementsSchema) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Check verification requirements",
        description:
          "Check if user meets verification requirements for a specific action",
        tags: ["User Verification"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["requiredStatus"],
                properties: {
                  requiredStatus: {
                    type: "string",
                    enum: [
                      "pending",
                      "profile_complete",
                      "documents_verified",
                      "admin_verified",
                      "fully_verified",
                      "suspended",
                      "rejected",
                    ],
                    description: "Required verification status for the action",
                    example: "documents_verified",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Verification requirements checked successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        isVerified: { type: "boolean", example: false },
                        currentStatus: {
                          type: "string",
                          example: "profile_complete",
                        },
                        requiredStatus: {
                          type: "string",
                          example: "documents_verified",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Verification requirements not met" },
        },
      },
    },
  },
  {
    path: "/verification/auto-update",
    controller: { post: controller.autoUpdateVerificationStatus },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Auto-update verification status",
        description:
          "Automatically update verification status based on user profile completion",
        tags: ["User Verification"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Verification status auto-updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        updated: { type: "boolean", example: true },
                        newStatus: {
                          type: "string",
                          example: "profile_complete",
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
    path: "/verification/pending",
    controller: { get: controller.getPendingVerifications },
    validators: { get: useValidator(getPendingVerificationsSchema) },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get pending verifications (Admin)",
        description: "Get list of users pending verification for admin review",
        tags: ["Admin", "User Verification"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "Number of records to return",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
          {
            name: "offset",
            in: "query",
            description: "Number of records to skip",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
        ],
        responses: {
          200: {
            description: "Pending verifications retrieved successfully",
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
                          fullName: { type: "string", example: "John Doe" },
                          email: {
                            type: "string",
                            example: "john@example.com",
                          },
                          verificationStatus: {
                            type: "string",
                            example: "profile_complete",
                          },
                          lastUpdated: { type: "string", format: "date-time" },
                          verificationNotes: { type: ["string", "null"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Insufficient permissions" },
        },
      },
    },
  },
  {
    path: "/verification/:userId/status",
    controller: { patch: controller.updateUserVerificationStatus },
    validators: { patch: useValidator(updateUserVerificationStatusSchema) },
    middlewares: { patch: [authenticateToken, requireRole(["admin"])] },
    docs: {
      patch: {
        summary: "Update user verification status (Admin)",
        description: "Update verification status for a specific user",
        tags: ["Admin", "User Verification"],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            description: "User ID to update",
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "pending",
                      "profile_complete",
                      "documents_verified",
                      "admin_verified",
                      "fully_verified",
                      "suspended",
                      "rejected",
                    ],
                    description: "New verification status",
                    example: "admin_verified",
                  },
                  notes: {
                    type: "string",
                    maxLength: 1000,
                    description:
                      "Optional notes about the verification decision",
                    example: "Documents verified successfully",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Verification status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        status: { type: "string", example: "admin_verified" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid status or user not found" },
          401: { description: "Unauthorized" },
          403: { description: "Insufficient permissions" },
        },
      },
    },
  },
];

export default verificationRoutes;
