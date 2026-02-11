import { JobInviteController } from "../../controllers/jobInvite";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import type { RouteDefinition } from "../types";

const controller = new JobInviteController();

// Export route prefix to mount under /job
export const routePrefix = "/job";

const inviteUserSchema = {
  type: "object",
  required: ["invitedUserId"],
  additionalProperties: false,
  properties: {
    invitedUserId: { type: "integer" },
    message: { type: ["string", "null"], maxLength: 500 },
  },
} as const;

const declineInviteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reason: { type: ["string", "null"], maxLength: 500 },
  },
} as const;

const jobInviteRoutes: RouteDefinition[] = [
  {
    path: "/:id/invite",
    controller: { post: controller.inviteUser },
    validators: { post: useValidator(inviteUserSchema as any) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Invite a user to a job",
        tags: ["Job Invites"],
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
                required: ["invitedUserId"],
                properties: {
                  invitedUserId: { type: "integer", example: 123 },
                  message: { type: "string", example: "I think you'd be perfect for this job!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User invited successfully" },
          400: { description: "User already invited or validation error" },
          404: { description: "Job or user not found" },
        },
      },
    },
  },
  {
    path: "/:id/invite/accept",
    controller: { post: controller.acceptInvite },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Accept a job invitation",
        tags: ["Job Invites"],
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
          200: { description: "Invitation accepted successfully" },
          404: { description: "Invitation not found" },
        },
      },
    },
  },
  {
    path: "/:id/invite/decline",
    controller: { post: controller.declineInvite },
    validators: { post: useValidator(declineInviteSchema as any) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Decline a job invitation",
        tags: ["Job Invites"],
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
                properties: {
                  reason: { type: "string", example: "Not available at that time" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Invitation declined" },
          404: { description: "Invitation not found" },
        },
      },
    },
  },
  {
    path: "/my/invites",
    controller: { get: controller.getMyInvites },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get my job invitations",
        tags: ["Job Invites"],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["invited", "accepted", "declined"],
            },
            description: "Filter by invitation status",
          },
        ],
        responses: {
          200: { description: "List of job invitations" },
        },
      },
    },
  },
];

export default jobInviteRoutes;

