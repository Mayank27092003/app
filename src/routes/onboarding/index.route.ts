import { RoleCategoryController } from "../../controllers/roleCategory";

export default [
  {
    path: "/roles/categories",
    controller: {
      get: RoleCategoryController.getRoleCategories,
    },
    docs: {
      get: {
        summary: "Get all role categories",
        tags: ["Onboarding"],
        responses: {
          200: {
            description: "List of role categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleCategories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", example: "1" },
                          name: { type: "string", example: "Company" },
                        },
                      },
                    },
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/roles/:roleCategoryId/company-types",
    controller: {
      get: RoleCategoryController.getCompanyTypes,
    },
    docs: {
      get: {
        summary: "Get company types for a role category",
        tags: ["Onboarding"],
        parameters: [
          {
            name: "roleCategoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID of the role category",
          },
        ],
        responses: {
          200: {
            description: "List of company types for a specific role category",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    companyTypes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", example: "101" },
                          name: { type: "string", example: "Broker" },
                        },
                      },
                    },
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          404: {
            description: "Role category not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Role category not found",
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
