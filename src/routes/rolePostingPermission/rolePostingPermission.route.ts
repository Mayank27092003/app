import { RolePostingPermissionController } from "../../controllers/rolePostingPermission";
import type { RouteDefinition } from "../types";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";

const controller = new RolePostingPermissionController();

const routes: RouteDefinition[] = [
  {
    path: "/",
    controller: { get: controller.list },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: { summary: "List role posting permissions", tags: ["Admin"] },
    },
  },
  {
    path: "/:posterRoleId/viewers",
    controller: { get: controller.getAllowedViewers },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get allowed viewer role IDs for a poster role",
        tags: ["Admin"],
        parameters: [
          {
            name: "posterRoleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      },
    },
  },
  {
    path: "/upsert",
    controller: { post: controller.upsert },
    middlewares: { post: [authenticateToken, requireRole(["admin"]) as any] },
    docs: {
      post: {
        summary: "Allow a poster role to target a viewer role",
        tags: ["Admin"],
      },
    },
  },
  {
    path: "/:posterRoleId/viewers",
    controller: { put: controller.bulkSet },
    middlewares: { put: [authenticateToken, requireRole(["admin"]) as any] },
    docs: {
      put: {
        summary: "Replace allowed viewer roles for a poster role",
        tags: ["Admin"],
        parameters: [
          {
            name: "posterRoleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      },
    },
  },
  {
    path: "/:posterRoleId/viewers/:viewerRoleId",
    controller: { delete: controller.remove },
    middlewares: { delete: [authenticateToken, requireRole(["admin"]) as any] },
    docs: {
      delete: {
        summary: "Remove permission for poster->viewer role",
        tags: ["Admin"],
      },
    },
  },
];

export default routes;
