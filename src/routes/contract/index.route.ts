import { JobController } from "../../controllers/job";
import { ContractController } from "../../controllers/contract";
import { RatingController } from "../../controllers/rating";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";

const controller = new JobController();
const contracts = new ContractController();
const rating = new RatingController();

export default [
  // List contracts
  {
    path: "/",
    controller: { get: contracts.list },
    middlewares: { get: [authenticateToken ] },
    docs: {
      get: {
        summary: "List contracts (isMine shows only posted by me)",
        tags: ["Contracts"],
        parameters: [
          { name: "isMine", in: "query", schema: { type: "boolean" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active","pending","completed","cancelled","onHold"] } },
          { name: "participantStatus", in: "query", description: "Filter my participation status (csv)", schema: { type: "string", example: "active,invited" } },
          { name: "participantRole", in: "query", description: "Filter my role in contracts (csv)", schema: { type: "string", example: "driver,carrier" } },
          { name: "includeRemovedParticipants", in: "query", description: "Include removed participants in related data", schema: { type: "boolean" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: { 200: { description: "Contracts listed with pagination" } },
      },
    },
  },
  // Rate a participant after completion
  {
    path: "/:contractId/rate",
    controller: { post: rating.rate },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Rate another user in the contract (1-5 stars)",
        description: "Create or update a rating for another user in a completed contract. The rater must be either hiredByUserId, hiredUserId, or a participant in the contract (including root contract).",
        tags: ["Contracts", "Ratings"],
        parameters: [
          {
            name: "contractId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID (can be root or child contract)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rateeUserId", "stars"],
                properties: {
                  rateeUserId: { type: "integer", description: "User ID to rate" },
                  stars: { type: "integer", minimum: 1, maximum: 5, description: "Rating from 1 to 5 stars" },
                  comment: { type: "string", maxLength: 1000, description: "Optional comment" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Rating saved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - contract not completed or cannot rate yourself" },
          403: { description: "Forbidden - user not part of contract" },
          404: { description: "Contract not found" },
        },
      },
    },
  },
  // Update rating
  {
    path: "/ratings/:ratingId",
    controller: { put: rating.updateRating },
    middlewares: { put: [authenticateToken] },
    docs: {
      put: {
        summary: "Update an existing rating",
        description: "Update a rating that you created. Only the rater can update their own rating.",
        tags: ["Contracts", "Ratings"],
        parameters: [
          {
            name: "ratingId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Rating ID to update",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["stars"],
                properties: {
                  stars: { type: "integer", minimum: 1, maximum: 5, description: "Updated rating from 1 to 5 stars" },
                  comment: { type: "string", maxLength: 1000, description: "Updated comment (optional)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Rating updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - can only update your own ratings" },
          404: { description: "Rating not found" },
        },
      },
    },
  },
  // Delete rating
  {
    path: "/ratings/:ratingId",
    controller: { delete: rating.deleteRating },
    middlewares: { delete: [authenticateToken] },
    docs: {
      delete: {
        summary: "Delete a rating",
        description: "Delete a rating that you created. Only the rater can delete their own rating. This action cannot be undone.",
        tags: ["Contracts", "Ratings"],
        parameters: [
          {
            name: "ratingId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Rating ID to delete",
          },
        ],
        responses: {
          200: {
            description: "Rating deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rating deleted successfully" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - can only delete your own ratings" },
          404: { description: "Rating not found" },
        },
      },
    },
  },
  // Start contract and hold escrow
  {
    path: "/:id/start",
    controller: { post: controller.startContract },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Start a contract and hold escrow",
        tags: ["Contracts", "Escrow"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID",
          },
        ],
        responses: {
          200: { description: "Contract started and escrow held successfully" },
          400: { description: "Bad request - contract cannot be started" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Contract not found" },
        },
      },
    },
  },

  // Complete job and release escrow
  {
    path: "/:id/complete",
    controller: { post: controller.completeJob },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Complete a job and release escrow to driver",
        tags: ["Contracts", "Escrow"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID",
          },
        ],
        responses: {
          200: { description: "Job completed and escrow released successfully" },
          400: { description: "Bad request - contract is not active" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Contract not found" },
        },
      },
    },
  },

  // Complete contract and create payouts (only root user/shipper)
  {
    path: "/:id/complete-contract",
    controller: { post: contracts.completeContract },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Complete contract and create payouts (only root contract owner can complete)",
        tags: ["Contracts", "Payouts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID",
          },
        ],
        responses: {
          200: {
            description: "Contract completed and payouts created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        contract: { type: "object" },
                        payouts: {
                          type: "array",
                          items: { type: "object" },
                        },
                        mainEarning: { type: "number" },
                      },
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - contract cannot be completed" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - only root contract owner can complete" },
          404: { description: "Contract not found" },
        },
      },
    },
  },
];
