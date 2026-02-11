// src/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerPaths } from "./swagger-builder";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LoadRider API",
      version: "1.0.0",
      description: "API documentation for LoadRider backend",
      contact: {
        name: "Abhishek Sharma",
        url: "https://my-portfolio-one-sooty-70.vercel.app/",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    // servers: [
    //   {
    //     url: 'http://localhost:3001',
    //     description: 'Local Dev Server'
    //   }
    // ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    // ✅ inject dynamic paths collected from route files
    paths: {
      "/health": {
        get: {
          summary: "Check API health status",
          tags: ["Health"],
          responses: {
            200: {
              description: "API is up and running",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "OK" },
                    },
                  },
                },
              },
            },
          },
          security: [],
        },
      },
      ...swaggerPaths, // ✅ inject dynamically loaded paths
    },
  },
  apis: ["./src/routes/**/*.ts"],
};

export const specs = swaggerJsdoc(options);
