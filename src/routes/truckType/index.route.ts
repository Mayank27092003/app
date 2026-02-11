import { useValidator } from "../../middlewares/validate";
import { createTruckTypeSchema, updateTruckTypeSchema } from "../../validators/truckType.schema";
import { TruckTypeController } from "../../controllers/truckType/controller";
import { authenticateToken } from "../../middlewares/authentication";

const controller = new TruckTypeController();

export default [
  {
    path: "/truck-types",
    controller: {
      get: controller.list,
      post: [authenticateToken, controller.create], // 🔒 protected
    },
    validators: {
      post: useValidator(createTruckTypeSchema),
    },
    docs: {
      get: {
        summary: "List all truck types",
        tags: ["TruckTypes"],
        responses: {
          200: {
            description: "List of truck types",
            content: {
              "application/json": {
                schema: { type: "array", items: createTruckTypeSchema },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new truck type",
        tags: ["TruckTypes"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: createTruckTypeSchema } },
        },
        responses: {
          201: { description: "Truck type created" },
          400: { description: "Validation error" },
        },
      },
    },
  },
  {
    path: "/truck-types/:id",
    controller: {
      get: controller.getById,
      put: [authenticateToken, controller.update], // 🔒 protected
      delete: [authenticateToken, controller.delete], // 🔒 protected
    },
    validators: {
      put: useValidator(updateTruckTypeSchema),
    },
    docs: {
      get: {
        summary: "Get truck type by ID",
        tags: ["TruckTypes"],
        responses: {
          200: { description: "Truck type object" },
          404: { description: "Not found" },
        },
      },
      put: {
        summary: "Update truck type",
        tags: ["TruckTypes"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: updateTruckTypeSchema } },
        },
        responses: {
          200: { description: "Truck type updated" },
          404: { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete truck type",
        tags: ["TruckTypes"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Deleted successfully" },
          404: { description: "Not found" },
        },
      },
    },
  },
];
