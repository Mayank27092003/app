import { RoleController } from "../../controllers/role";

const controller = new RoleController();

export const routePrefix = "/roles";

export default [
  {
    path: "/",
    controller: {
      get: controller.getAll,
    },
    docs: {
      get: {
        summary: "Get all roles",
        tags: ["Roles"],
        responses: {
          200: {
            description: "List of all roles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "integer",
                            example: 1,
                          },
                          name: {
                            type: "string",
                            example: "shipper",
                          },
                          description: {
                            type: "string",
                            example: "Posts job requests",
                          },
                          isCompanyRole: {
                            type: "boolean",
                            example: false,
                          },
                          jobPostFee: {
                            type: "number",
                            example: 0,
                          },
                          sortOrder: {
                            type: "integer",
                            example: 1,
                          },
                          userCount: {
                            type: "integer",
                            example: 5,
                            description: "Number of users with this role",
                          },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2024-01-01T00:00:00.000Z",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    message: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
        security: [],
      },
    },
  },
  {
    path: "/:id",
    controller: {
      get: controller.getById,
    },
    docs: {
      get: {
        summary: "Get all roles",
        tags: ["Roles"],
        responses: {
          200: {
            description: "List of all roles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "integer",
                            example: 1,
                          },
                          name: {
                            type: "string",
                            example: "shipper",
                          },
                          description: {
                            type: "string",
                            example: "Posts job requests",
                          },
                          isCompanyRole: {
                            type: "boolean",
                            example: false,
                          },
                          jobPostFee: {
                            type: "number",
                            example: 0,
                          },
                          sortOrder: {
                            type: "integer",
                            example: 1,
                          },
                          userCount: {
                            type: "integer",
                            example: 5,
                            description: "Number of users with this role",
                          },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2024-01-01T00:00:00.000Z",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    message: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
        security: [],
      },
    },
  },
  {
    path: "/:id",
    controller: {
      get: controller.getById,
    },
    docs: {
      get: {
        summary: "Get a role by ID",
        tags: ["Roles"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        responses: {
          200: {
            description: "Role retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "shipper" },
                        description: { type: "string", example: "Posts job requests" },
                        isCompanyRole: { type: "boolean", example: false },
                        jobPostFee: { type: "number", example: 0 },
                        sortOrder: { type: "integer", example: 1 },
                        userCount: { type: "integer", example: 5 },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid ID" },
          404: { description: "Role not found" },
          500: { description: "Internal server error" },
        },
        security: [],
      },
    },
  },
];

