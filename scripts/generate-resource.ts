#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";

const resourceName = process.argv[2];

if (!resourceName) {
  console.error("❌ Please provide a resource name.");
  process.exit(1);
}

const baseName = resourceName.toLowerCase();
const pascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

// Paths
const controllerDir = path.join("src", "controllers", baseName);
const controllerFile = path.join(controllerDir, "index.ts");
const validatorFile = path.join("src", "validators", `${baseName}.schema.ts`);
const routeFile = path.join("src", "routes", `${baseName}.route.ts`);

// Create controller
if (!fs.existsSync(controllerDir)) {
  fs.mkdirSync(controllerDir, { recursive: true });
}
if (!fs.existsSync(controllerFile)) {
  fs.writeFileSync(
    controllerFile,
    `import { Request, Response } from "express";

export class ${pascalName}Controller {
  async get(req: Request, res: Response) {
    res.json({ message: "GET /${baseName}" });
  }

  async post(req: Request, res: Response) {
    res.json({ message: "POST /${baseName}" });
  }

  async put(req: Request, res: Response) {
    res.json({ message: "PUT /${baseName}/:id" });
  }

  async delete(req: Request, res: Response) {
    res.json({ message: "DELETE /${baseName}/:id" });
  }
}
`
  );
  console.log(`✅ Created controller: ${controllerFile}`);
}

// Create validator
if (!fs.existsSync(validatorFile)) {
  fs.writeFileSync(
    validatorFile,
    `import { JSONSchemaType } from "ajv";

export interface Create${pascalName}DTO {
  // name: string;
}

export const create${pascalName}Schema: JSONSchemaType<Create${pascalName}DTO> = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {},
};
`
  );
  console.log(`✅ Created validator: ${validatorFile}`);
}

// Create route with Swagger docs
if (!fs.existsSync(routeFile)) {
  fs.writeFileSync(
    routeFile,
    `import { ${pascalName}Controller } from "../controllers/${baseName}";
import { buildValidator } from "../middlewares/validate";
import { create${pascalName}Schema } from "../validators/${baseName}.schema";
import type { RouteDefinition } from "./types";

const controller = new ${pascalName}Controller();

const ${baseName}Routes: RouteDefinition[] = [
  {
    path: "/${baseName}",
    controller: {
      get: controller.get,
      post: controller.post,
    },
    validators: {
      post: buildValidator(create${pascalName}Schema),
    },
    docs: {
      get: {
        summary: "Get all ${baseName}",
        tags: ["${pascalName}"],
        responses: {
          200: { description: "List of ${baseName}" }
        }
      },
      post: {
        summary: "Create a ${baseName}",
        tags: ["${pascalName}"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: create${pascalName}Schema,
            }
          }
        },
        responses: {
          201: { description: "${pascalName} created successfully" },
          400: { description: "Invalid data" }
        }
      }
    }
  },
  {
    path: "/${baseName}/:id",
    controller: {
      put: controller.put,
      delete: controller.delete,
    },
    docs: {
      put: {
        summary: "Update a ${baseName} by ID",
        tags: ["${pascalName}"],
        responses: {
          200: { description: "${pascalName} updated" },
          404: { description: "${pascalName} not found" }
        }
      },
      delete: {
        summary: "Delete a ${baseName} by ID",
        tags: ["${pascalName}"],
        responses: {
          200: { description: "${pascalName} deleted" },
          404: { description: "${pascalName} not found" }
        }
      }
    }
  }
];

export default ${baseName}Routes;
`
  );
  console.log(`✅ Created route with Swagger docs: ${routeFile}`);
}
