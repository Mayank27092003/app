import { TripInspectionController } from "../../controllers/contract/tripInspection.controller";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import type { RouteDefinition } from "../types";

const controller = new TripInspectionController();

const startSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { type: "string", enum: ["pre", "post"] } },
  additionalProperties: true,
} as const;

const routes: RouteDefinition[] = [
  {
    path: "/:id/inspections/start",
    controller: { post: controller.start },
    validators: { post: useValidator(startSchema as any) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Start pre or post trip inspection",
        tags: ["Inspections"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            description: "Contract ID",
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: { type: "string", enum: ["pre", "post"] },
                },
              },
              examples: {
                pre: { value: { type: "pre" } },
                post: { value: { type: "post" } },
              },
            },
          },
        },
        responses: { 200: { description: "Started or existing" } },
      },
    },
  },
  {
    path: "/:id/inspections/mine",
    controller: { get: controller.mine },
    middlewares: { get: authenticateToken },
    docs: {
      get: {
        summary: "Get my inspections for this contract",
        tags: ["Inspections"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            description: "Contract ID",
            schema: { type: "integer" },
          },
        ],
      },
    },
  },
  {
    path: "/inspections/:inspectionId/complete",
    controller: { post: controller.complete },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary:
          "Complete inspection with data/defects/photos and optional podPhoto (proof of delivery)",
        tags: ["Inspections"],
        parameters: [
          {
            in: "path",
            name: "inspectionId",
            required: true,
            description: "Inspection ID",
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "object", nullable: true },
                  defects: { type: "object", nullable: true },
                  photos: {
                    type: "array",
                    items: { type: "object" },
                    nullable: true,
                  },
                  podPhoto: {
                    type: "object",
                    nullable: true,
                    description: "Proof of delivery photo metadata",
                  },
                },
              },
              examples: {
                example: {
                  value: {
                    data: { odometer: 12345 },
                    defects: { lights: "ok" },
                    photos: [{ url: "https://cdn/...", label: "front" }],
                    podPhoto: { url: "https://cdn/.../pod.jpg", label: "POD" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Inspection completed" },
        },
      },
    },
  },
  {
    path: "/:id/inspections/submit-payment",
    controller: { post: controller.submit },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Submit pre+post for payment (requires both completed)",
        tags: ["Inspections"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            description: "Contract ID",
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Submitted" } },
      },
    },
  },
];

export default routes;
