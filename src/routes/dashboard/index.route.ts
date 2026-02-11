import { DashboardController } from "../../controllers/dashboard";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import type { RouteDefinition } from "../types";

const dashboard = new DashboardController();

const dashboardRoutes: RouteDefinition[] = [
  {
    path: "/",
    controller: { get: dashboard.getUserDashboard },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get user dashboard statistics",
        description: "Get dashboard statistics for the authenticated user including total completed jobs count and ratings summary (average and count).",
        tags: ["Dashboard"],
        responses: {
          200: {
            description: "Dashboard statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalCompletedJobs: {
                          type: "integer",
                          example: 15,
                          description: "Total number of completed contracts where user is involved (as hiredByUserId, hiredUserId, or participant)",
                        },
                        ratings: {
                          type: "object",
                          properties: {
                            average: {
                              type: "number",
                              example: 4.5,
                              description: "Average rating received by the user",
                            },
                            count: {
                              type: "integer",
                              example: 10,
                              description: "Total number of ratings received by the user",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  data: {
                    totalCompletedJobs: 15,
                    ratings: {
                      average: 4.5,
                      count: 10,
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
    path: "/admin",
    controller: { get: dashboard.getAdminDashboard },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get admin dashboard statistics",
        description: "Get dashboard statistics for admin including total users, active jobs, revenue, and recent jobs.",
        tags: ["Dashboard", "Admin"],
        responses: {
          200: {
            description: "Admin dashboard statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalUsers: { type: "integer", description: "Total number of users" },
                        activeJobs: { type: "integer", description: "Number of active jobs" },
                        totalRevenue: { type: "number", description: "Total revenue from completed jobs" },
                        openDisputes: { type: "integer", description: "Number of open disputes" },
                        recentJobs: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              title: { type: "string" },
                              company: { type: "string" },
                              status: { type: "string" },
                              amount: { type: "number" },
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
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin access required" },
        },
      },
    },
  },
];

export default dashboardRoutes;

