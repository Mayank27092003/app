import { ContractParticipantsController } from "../../controllers/contract/participants.controller";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import type { RouteDefinition } from "../types";

const controller = new ContractParticipantsController();

const addDriverSchema = {
  type: "object",
  required: ["driverUserId"],
  additionalProperties: false,
  properties: { driverUserId: { type: "integer" } },
} as const;

const changeDriverSchema = {
  type: "object",
  required: ["newDriverUserId", "reason"],
  additionalProperties: false,
  properties: {
    currentDriverUserId: { type: ["integer", "null"] },
    newDriverUserId: { type: "integer" },
    reason: { type: "string", minLength: 3 },
  },
} as const;

const participantsRoutes: RouteDefinition[] = [
  // Carrier invite/accept/decline
  {
    path: "/:id/participants/carrier",
    controller: { post: controller.addCarrier },
    validators: {
      post: useValidator({
        type: "object",
        required: ["carrierUserId"],
        additionalProperties: false,
        properties: { carrierUserId: { type: "integer" } },
      } as any),
    },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Invite carrier to contract (immutable once accepted)",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { carrierUserId: { type: "integer" } },
                required: ["carrierUserId"],
              },
            },
          },
        },
        responses: {
          200: { description: "Carrier invited" },
          400: { description: "Carrier immutable or validation error" },
        },
      },
    },
  },
  {
    path: "/:id/participants/carrier/accept",
    controller: { post: controller.acceptCarrierInvite },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Carrier accepts invitation",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Carrier accepted" },
          400: { description: "Invite not pending" },
        },
      },
    },
  },
  {
    path: "/:id/participants/carrier/decline",
    controller: { post: controller.declineCarrierInvite },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Carrier declines invitation",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Carrier declined" },
          400: { description: "Invite not pending" },
        },
      },
    },
  },
  {
    path: "/:id/participants/driver",
    controller: { post: controller.addDriver },
    validators: { post: useValidator(addDriverSchema as any) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Add a driver to contract (max 2)",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: { "application/json": { schema: addDriverSchema } },
        },
        responses: {
          200: { description: "Driver added" },
          400: { description: "Validation or limit exceeded" },
        },
      },
    },
  },
  {
    path: "/:id/participants/driver/:userId",
    controller: { delete: controller.removeDriver },
    middlewares: { delete: authenticateToken },
    docs: {
      delete: {
        summary: "Remove a driver from contract and chat",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Driver removed" },
          404: { description: "Not found" },
        },
      },
    },
  },
  {
    path: "/:id/participants/change-driver",
    controller: { post: controller.changeDriver },
    validators: { post: useValidator(changeDriverSchema as any) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Change driver (remove optional current, add new) with reason",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: { "application/json": { schema: changeDriverSchema } },
        },
        responses: {
          200: { description: "Driver changed" },
          400: { description: "Validation error" },
        },
      },
    },
  },
  {
    path: "/:id/participants/accept",
    controller: { post: controller.acceptInvite },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Driver accepts contract invitation",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Invitation accepted" },
          400: { description: "Invite not pending" },
        },
      },
    },
  },
  {
    path: "/:id/participants/decline",
    controller: { post: controller.declineInvite },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Driver declines contract invitation",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Invitation declined" },
          400: { description: "Invite not pending" },
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
        summary: "Get my pending contract invites",
        tags: ["Contracts"],
        parameters: [
          {
            name: "role",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["driver", "carrier", "shipper", "broker"]
            },
            description: "Filter by user role"
          }        
        ],
        responses: { 200: { description: "List of invites" } },
      },
    },
  },
  {
    path: "/:id/participants/driver/visibility",
    controller: { post: controller.setDriverLocationVisibility },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Set which driver's location is visible for this contract",
        tags: ["Contracts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["driverUserId", "isLocationVisible"],
                properties: {
                  driverUserId: { type: "integer" },
                  isLocationVisible: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Visibility updated" } },
      },
    },
  },
];

export default participantsRoutes;
