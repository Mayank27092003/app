import { FcmTokenController } from "../../controllers/fcm";
import { authenticateToken } from "../../middlewares/authentication";
import type { RouteDefinition } from "../types";

const controller = new FcmTokenController();

const fcmRoutes: RouteDefinition[] = [
  {
    path: "/register",
    controller: { post: controller.registerToken },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Register or update FCM token",
        description: "Register a new FCM token or update existing one for the authenticated user",
        tags: ["FCM Tokens"],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fcmToken"],
                properties: {
                  fcmToken: {
                    type: "string",
                    description: "Firebase Cloud Messaging token"
                  },
                  deviceId: {
                    type: "string",
                    description: "Optional device identifier"
                  },
                  deviceType: {
                    type: "string",
                    enum: ["android", "ios", "web"],
                    description: "Type of device"
                  },
                  deviceName: {
                    type: "string",
                    description: "Human-readable device name"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "FCM token registered successfully",
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
                        userId: { type: "integer", example: 1 },
                        fcmToken: { type: "string", example: "fcm_token_here" },
                        deviceId: { type: ["string", "null"], example: "device_123" },
                        deviceType: { type: ["string", "null"], example: "android" },
                        deviceName: { type: ["string", "null"], example: "Samsung Galaxy" },
                        isActive: { type: "boolean", example: true },
                        lastUsedAt: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "FCM token is required" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/tokens",
    controller: { get: controller.getUserTokens },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get user FCM tokens",
        description: "Retrieve all active FCM tokens for the authenticated user",
        tags: ["FCM Tokens"],

        responses: {
          200: {
            description: "FCM tokens retrieved successfully",
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
                          userId: { type: "integer", example: 1 },
                          fcmToken: { type: "string", example: "fcm_token_here" },
                          deviceId: { type: ["string", "null"], example: "device_123" },
                          deviceType: { type: ["string", "null"], example: "android" },
                          deviceName: { type: ["string", "null"], example: "Samsung Galaxy" },
                          isActive: { type: "boolean", example: true },
                          lastUsedAt: { type: "string", format: "date-time" },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/tokens/:tokenId/deactivate",
    controller: { delete: controller.deactivateToken },
    middlewares: { delete: authenticateToken },
    docs: {
      delete: {
        summary: "Deactivate FCM token",
        description: "Deactivate a specific FCM token for the authenticated user",
        tags: ["FCM Tokens"],

        parameters: [
          {
            name: "tokenId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID of the FCM token to deactivate"
          }
        ],
        responses: {
          200: {
            description: "FCM token deactivated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "FCM token deactivated successfully" }
                  }
                }
              }
            }
          },
          400: { description: "Token ID is required" },
          401: { description: "Unauthorized" },
          404: { description: "Token not found" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/devices/:deviceId/deactivate",
    controller: { delete: controller.deactivateDeviceTokens },
    middlewares: { delete: authenticateToken },
    docs: {
      delete: {
        summary: "Deactivate device FCM tokens",
        description: "Deactivate all FCM tokens for a specific device",
        tags: ["FCM Tokens"],

        parameters: [
          {
            name: "deviceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Device identifier"
          }
        ],
        responses: {
          200: {
            description: "Device FCM tokens deactivated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Device FCM tokens deactivated successfully" }
                  }
                }
              }
            }
          },
          400: { description: "Device ID is required" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/deactivate-all",
    controller: { delete: controller.deactivateAllTokens },
    middlewares: { delete: authenticateToken },
    docs: {
      delete: {
        summary: "Deactivate all FCM tokens",
        description: "Deactivate all FCM tokens for the authenticated user (logout from all devices)",
        tags: ["FCM Tokens"],

        responses: {
          200: {
            description: "All FCM tokens deactivated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "All FCM tokens deactivated successfully" }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/stats",
    controller: { get: controller.getTokenStats },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get FCM token statistics",
        description: "Get statistics about FCM tokens for the authenticated user",
        tags: ["FCM Tokens"],

        responses: {
          200: {
            description: "FCM token statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalTokens: { type: "integer", example: 3 },
                        activeTokens: { type: "integer", example: 2 },
                        devices: {
                          type: "array",
                          items: { type: "string" },
                          example: ["android", "ios"]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" }
        }
      }
    }
  }
];

export default fcmRoutes;
