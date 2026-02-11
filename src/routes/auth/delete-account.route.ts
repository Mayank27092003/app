import { AuthController } from "../../controllers/auth";
import { useValidator } from "../../middlewares/validate";
import { deleteAccountSchema } from "../../validators/auth.schema";
import { authenticateToken } from "../../middlewares/authentication";
import type { RouteDefinition } from "../types";

const controller = new AuthController();

const deleteAccountRoute: RouteDefinition = {
  path: "/delete-account",
  controller: { delete: controller.deleteAccount },
  validators: { delete: useValidator(deleteAccountSchema) },
  middlewares: { delete: authenticateToken },
  docs: {
    delete: {
      summary: "Delete user account",
      description: "Permanently delete the authenticated user's account. Requires password confirmation for security. This action cannot be undone.",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: deleteAccountSchema,
            example: {
              password: "YourCurrentPassword123!",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Account deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Account deleted successfully." },
                },
              },
            },
          },
        },
        401: {
          description: "Unauthorized - Invalid password or missing/invalid token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Invalid password. Account deletion failed." },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User not found" },
                },
              },
            },
          },
        },
        500: {
          description: "Internal server error - Failed to delete account",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Failed to delete account. Please try again." },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default deleteAccountRoute;

