import { CacheController } from "../../controllers/cache";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import type { RouteDefinition } from "../types";

const controller = new CacheController();

const cacheRoutes: RouteDefinition[] = [
  {
    path: "/cache/clear",
    controller: { post: controller.clearAll },
    middlewares: {
      post: [authenticateToken, requireRole(["admin"])],
    },
    docs: {
      post: {
        summary: "Clear all cache",
        tags: ["Cache"],
        responses: {
          200: { description: "All cache cleared successfully." },
        },
      },
    },
  },
  {
    path: "/cache/:section/clear",
    controller: { post: controller.clearSection },
    middlewares: {
      post: [authenticateToken, requireRole(["admin"])],
    },
    docs: {
      post: {
        summary: "Clear a specific cache section",
        tags: ["Cache"],
        parameters: [
          {
            name: "section",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Cache section name",
          },
        ],
        responses: {
          200: { description: "Cache section cleared" },
        },
      },
    },
  },
  {
    path: "/cache/keys",
    controller: { get: controller.listKeys },
    middlewares: {
      get: [authenticateToken, requireRole(["admin"])],
    },
    docs: {
      get: {
        summary: "List all cached section keys",
        tags: ["Cache"],
        responses: {
          200: {
            description: "List of cached keys",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cacheKeys: {
                      type: "array",
                      items: { type: "string" },
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
];

export default cacheRoutes;
