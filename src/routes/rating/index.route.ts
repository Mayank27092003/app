import { RatingController } from "../../controllers/rating";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import type { RouteDefinition } from "../types";

const rating = new RatingController();

const ratingRoutes: RouteDefinition[] = [
  // Get ratings received by a user (with optional filter by rater)
  {
    path: "/users/:userId/ratings",
    controller: { get: rating.userRatings },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get ratings received by a user",
        description: "Get all ratings received by a user (where user is the ratee). Returns average rating and list of reviews. Optionally filter by raterUserId using query parameter.",
        tags: ["Ratings"],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID to get ratings for",
          },
          {
            name: "raterId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Optional: Filter ratings by specific rater user ID",
          },
        ],
        responses: {
          200: {
            description: "Ratings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        summary: {
                          type: "object",
                          properties: {
                            average: { type: "number", example: 4.5 },
                            count: { type: "integer", example: 10 },
                          },
                        },
                        reviews: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              contractId: { type: "integer" },
                              raterUserId: { type: "integer" },
                              rateeUserId: { type: "integer" },
                              stars: { type: "integer" },
                              comment: { type: "string" },
                              createdAt: { type: "string" },
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
          404: { description: "User not found" },
        },
      },
    },
  },
  // Get ratings given by a user (with full populated data)
  {
    path: "/users/:userId/ratings-given",
    controller: { get: rating.ratingsGivenByUser },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get all ratings given by a user",
        description: "Get all ratings that a user has given to others. Includes full populated data: contract details (with job, parentContract, participants), ratee user details (with roles, company, driver). Optionally filter by rateeUserId using query parameter.",
        tags: ["Ratings"],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID who gave the ratings",
          },
          {
            name: "rateeId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Optional: Filter ratings by specific ratee user ID",
          },
        ],
        responses: {
          200: {
            description: "Ratings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        count: { type: "integer", example: 5 },
                        ratings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              contractId: { type: "integer" },
                              raterUserId: { type: "integer" },
                              rateeUserId: { type: "integer" },
                              stars: { type: "integer" },
                              comment: { type: "string" },
                              createdAt: { type: "string" },
                              updatedAt: { type: "string" },
                              contract: {
                                type: "object",
                                description: "Full contract details with job, parentContract, and participants",
                              },
                              ratee: {
                                type: "object",
                                description: "Full user details with roles, company, and driver info",
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
          404: { description: "User not found" },
        },
      },
    },
  },
  // Get all ratings for a contract
  {
    path: "/contracts/:contractId/ratings",
    controller: { get: rating.contractRatings },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get all ratings for a contract",
        description: "Get all ratings given within a specific contract. Returns all ratings with full populated data including rater and ratee user details (with roles, company, driver), showing who rated whom in the contract.",
        tags: ["Ratings"],
        parameters: [
          {
            name: "contractId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID to get ratings for",
          },
        ],
        responses: {
          200: {
            description: "Contract ratings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        contractId: { type: "integer", example: 123 },
                        count: { type: "integer", example: 3 },
                        ratings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              contractId: { type: "integer" },
                              raterUserId: { type: "integer" },
                              rateeUserId: { type: "integer" },
                              stars: { type: "integer" },
                              comment: { type: "string" },
                              createdAt: { type: "string" },
                              updatedAt: { type: "string" },
                              rater: {
                                type: "object",
                                description: "Full rater user details with roles, company, and driver info",
                              },
                              ratee: {
                                type: "object",
                                description: "Full ratee user details with roles, company, and driver info",
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
          404: { description: "Contract not found" },
        },
      },
    },
  },
];

export default ratingRoutes;

