import { NotificationController } from "../../controllers/notification";
import { authenticateToken } from "../../middlewares/authentication";
import type { RouteDefinition } from "../types";

const controller = new NotificationController();

const notificationRoutes: RouteDefinition[] = [
  {
    path: "/",
    controller: { get: controller.getUserNotifications },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get user notifications",
        description: "Retrieve notifications for the authenticated user",
        tags: ["Notifications"],
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 50 },
            description: "Number of notifications to return",
          },
          {
            name: "offset",
            in: "query",
            required: false,
            schema: { type: "integer", default: 0 },
            description: "Number of notifications to skip",
          },
          {
            name: "unreadOnly",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "Return only unread notifications",
          },
        ],
        responses: {
          200: {
            description: "Notifications retrieved successfully",
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
                          userId: { type: "integer", example: 123 },
                          type: { type: "string", example: "document_verified" },
                          title: { type: "string", example: "Document Verified" },
                          message: { type: "string", example: "Your document has been verified" },
                          entityType: { type: "string", example: "document" },
                          entityId: { type: "integer", example: 456 },
                          read: { type: "boolean", example: false },
                          readAt: { type: ["string", "null"], format: "date-time" },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    total: { type: "integer", example: 10 },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  {
    path: "/unread",
    controller: { get: controller.getUnreadCount },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get unread notification count",
        description: "Get the count of unread notifications for the authenticated user",
        tags: ["Notifications"],
        responses: {
          200: {
            description: "Unread count retrieved successfully",
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
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  {
    path: "/:id/read",
    controller: { patch: controller.markAsRead },
    middlewares: { patch: authenticateToken },
    docs: {
      patch: {
        summary: "Mark notification as read",
        description: "Mark a specific notification as read",
        tags: ["Notifications"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Notification ID",
          },
        ],
        responses: {
          200: {
            description: "Notification marked as read successfully",
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
                        read: { type: "boolean", example: true },
                        readAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid notification ID" },
          401: { description: "Unauthorized" },
          404: { description: "Notification not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  {
    path: "/read-all",
    controller: { patch: controller.markAllAsRead },
    middlewares: { patch: authenticateToken },
    docs: {
      patch: {
        summary: "Mark all notifications as read",
        description: "Mark all notifications as read for the authenticated user",
        tags: ["Notifications"],
        responses: {
          200: {
            description: "All notifications marked as read successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        updatedCount: { type: "integer", example: 10 },
                      },
                    },
                    message: { type: "string", example: "10 notifications marked as read" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  {
    path: "/:id",
    controller: { delete: controller.deleteNotification },
    middlewares: { delete: authenticateToken },
    docs: {
      delete: {
        summary: "Delete notification",
        description: "Delete a specific notification (soft delete)",
        tags: ["Notifications"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Notification ID",
          },
        ],
        responses: {
          200: {
            description: "Notification deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Notification deleted successfully" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid notification ID" },
          401: { description: "Unauthorized" },
          404: { description: "Notification not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
];

export default notificationRoutes;

