import { UserController } from "../../controllers/user";
import { buildValidator, validate } from "../../middlewares/validate";
import { createUserSchema } from "../../validators/user.schema";
import { authenticateToken } from "../../middlewares/authentication";
import { uploadSingle } from "../../middlewares/upload";
import { requireUploadInput } from "../../middlewares/requireUploadInput";
import uploadController from "../../controllers/upload";
import type { RouteDefinition } from "../types";

const controller = new UserController();

const userRoutes: RouteDefinition[] = [
  {
    path: "/",
    controller: {
      post: uploadController.upload,
    },
    middlewares: {
      post: [requireUploadInput as any] as any,
    },
    docs: {
      post: {
        summary: "Upload a file and receive a URL",
        tags: ["Upload"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Upload successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", format: "uri" },
                    key: { type: "string" },
                    size: { type: "integer" },
                    mimetype: { type: "string" },
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

export default userRoutes;
