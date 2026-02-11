import { CompanyUserController } from "../../controllers/companyUser";
import { buildValidator, validate } from "../../middlewares/validate";
import { authenticateToken } from "../../middlewares/authentication";
import {
  addUserToCompanySchema,
  updateUserRoleSchema,
} from "../../validators/companyUser.schema";

const controller = new CompanyUserController();

export const routePrefix = "/company";

export default [
  {
    path: "/users/:userId/companies",
    controller: {
      get: controller.getUserCompanies,
    },
    middlewares: {
      get: [authenticateToken],
    },
    docs: {
      get: {
        summary: "Get all companies a user belongs to",
        tags: ["Company Users"],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the user",
          },
        ],
        responses: {
          200: {
            description: "List of companies the user belongs to",
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
                          id: { type: "integer" },
                          companyId: { type: "integer" },
                          userId: { type: "integer" },
                          roleId: { type: ["integer", "null"] },
                          isPrimary: { type: "boolean" },
                          company: {
                            type: "object",
                            description: "Company details",
                          },
                          role: {
                            type: "object",
                            description: "Role details",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
          },
        },
      },
    },
  },
  {
    path: "/:companyId/users",
    controller: {
      get: controller.getCompanyUsers,
      post: controller.addUser,
    },
    validators: {
      post: validate(buildValidator(addUserToCompanySchema)),
    },
    middlewares: {
      get: [authenticateToken],
      post: [authenticateToken],
    },
    docs: {
      get: {
        summary: "Get all users in a company",
        tags: ["Company Users"],
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the company",
          },
        ],
        responses: {
          200: {
            description: "List of users in the company",
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
                          id: { type: "integer" },
                          companyId: { type: "integer" },
                          userId: { type: "integer" },
                          roleId: { type: ["integer", "null"] },
                          isPrimary: { type: "boolean" },
                          user: {
                            type: "object",
                            description: "User details",
                          },
                          role: {
                            type: "object",
                            description: "Role details",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Company not found",
          },
        },
      },
      post: {
        summary: "Add a user to a company",
        tags: ["Company Users"],
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the company",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: {
                    type: "integer",
                    description: "ID of the user to add",
                  },
                  roleId: {
                    type: "integer",
                    nullable: true,
                    description: "ID of the role to assign",
                  },
                  isPrimary: {
                    type: "boolean",
                    description: "Whether this user is the primary user",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User added to company successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "User added to company successfully",
                    },
                    data: {
                      type: "object",
                      description: "Company user relationship",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request - user already in company or invalid input",
          },
          404: {
            description: "Company, user, or role not found",
          },
        },
      },
    },
  },
  {
    path: "/:companyId/users/:userId",
    controller: {
      delete: controller.removeUser,
    },
    middlewares: {
      delete: [authenticateToken],
    },
    docs: {
      delete: {
        summary: "Remove a user from a company",
        tags: ["Company Users"],
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the company",
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the user to remove",
          },
        ],
        responses: {
          200: {
            description: "User removed from company successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "User removed from company successfully",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Company or user not found, or user not in company",
          },
        },
      },
    },
  },
  {
    path: "/:companyId/users/:userId/role",
    controller: {
      put: controller.updateUserRole,
    },
    validators: {
      put: validate(buildValidator(updateUserRoleSchema)),
    },
    middlewares: {
      put: [authenticateToken],
    },
    docs: {
      put: {
        summary: "Update a user's role in a company",
        tags: ["Company Users"],
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the company",
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "ID of the user",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  roleId: {
                    type: "integer",
                    nullable: true,
                    description: "ID of the role to assign",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User role updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "User role updated successfully",
                    },
                    data: {
                      type: "object",
                      description: "Updated company user relationship",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Company, user, or role not found, or user not in company",
          },
        },
      },
    },
  },
];

