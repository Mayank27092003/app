import { TranslationController } from "../../controllers/translation";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import { requireUploadInput } from "../../middlewares/requireUploadInput";
import type { RouteDefinition } from "../types";

const controller = new TranslationController();

const routes: RouteDefinition[] = [
  /**
   * Get list of available languages
   * GET /api/v1/translations/languages
   * Public endpoint - no authentication required
   * Must come before /:lang route to avoid route conflicts
   */
  {
    path: "/languages",
    controller: { get: controller.getAvailableLanguages },
    docs: {
      get: {
        summary: "Get list of available languages (Public)",
        tags: ["Translations"],
        parameters: [
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["mobile", "admin", "backend"] },
            description: "Filter by translation type (default: all types)",
            example: "mobile",
          },
        ],
        responses: {
          200: {
            description: "Object with success, total, and languages array",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "number", example: 3 },
                    languages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          code: { type: "string", example: "en" },
                          name: { type: "string", example: "English" },
                          flagUrl: { type: "string", example: "https://flagcdn.com/w40/gb.png" },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  total: 3,
                  languages: [
                    {
                      code: "en",
                      name: "English",
                      flagUrl: "https://flagcdn.com/w40/gb.png",
                    },
                    {
                      code: "es",
                      name: "Spanish",
                      flagUrl: "https://flagcdn.com/w40/es.png",
                    },
                    {
                      code: "fr",
                      name: "French",
                      flagUrl: "https://flagcdn.com/w40/fr.png",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },

  /**
   * Get all translation keys with all language values
   * GET /api/v1/translations/keys?type=mobile|admin|backend&namespace=common
   * Public endpoint - returns array of keys with all language values
   * Must come before /:lang to avoid route conflicts
   */
  {
    path: "/keys",
    controller: { get: controller.getAllTranslationKeys },
    docs: {
      get: {
        summary: "Get all translation keys with all language values (Public)",
        tags: ["Translations"],
        description: "Returns array of translation keys with values for all languages. Example: [{ key: 'auth.login.title', en: 'Welcome Back', es: 'Bienvenido' }]",
        parameters: [
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["mobile", "admin", "backend"] },
            description: "Translation type (default: mobile)",
            example: "mobile",
          },
          {
            name: "namespace",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filter by namespace (e.g., 'common', 'auth')",
            example: "common",
          },
        ],
        responses: {
          200: {
            description: "Object with success, total, type, namespace, and keys array",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "number", example: 2 },
                    type: { type: "string", example: "mobile" },
                    namespace: { type: ["string", "null"], example: "common" },
                    keys: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string", example: "auth.login.title" },
                          en: { type: "string", example: "Welcome Back" },
                          es: { type: "string", example: "Bienvenido" },
                        },
                        additionalProperties: true,
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  total: 2,
                  type: "mobile",
                  namespace: "common",
                  keys: [
                    {
                      key: "auth.login.title",
                      en: "Welcome Back",
                      es: "Bienvenido",
                      fr: "Bon retour",
                    },
                    {
                      key: "common.loading",
                      en: "Loading...",
                      es: "Cargando...",
                      fr: "Chargement...",
                    },
                  ],
                },
              },
            },
          },
          400: { description: "Bad request - invalid type" },
        },
      },
    },
  },

  /**
   * Get translation file for a specific language
   * GET /api/v1/translations/:lang
   * Public endpoint - no authentication required
   * Must come after /languages and /keys to avoid route conflicts
   */
  {
    path: "/:lang",
    controller: { get: controller.getTranslationFile },
    docs: {
      get: {
        summary: "Get translation file for a specific language (Public)",
        tags: ["Translations"],
        parameters: [
          {
            name: "lang",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "2-letter language code (e.g., 'en', 'fr', 'es')",
            example: "en",
          },
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["mobile", "admin", "backend"] },
            description: "Translation type: mobile, admin, or backend (default: mobile)",
            example: "mobile",
          },
        ],
        responses: {
          200: {
            description: "Translation file retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    lang: { type: "string", example: "en" },
                    type: { type: "string", example: "mobile" },
                    data: {
                      type: "object",
                      description: "Translation object with namespaces and keys",
                      additionalProperties: true,
                    },
                  },
                },
                example: {
                  success: true,
                  lang: "en",
                  type: "mobile",
                  data: {
                    common: {
                      loading: "Loading...",
                      error: "Error",
                      success: "Success"
                    },
                    auth: {
                      login: {
                        title: "Welcome Back",
                        subtitle: "Sign in to continue"
                      }
                    }
                  }
                },
              },
            },
          },
          400: { description: "Bad request - invalid language code" },
          404: { description: "Translation file not found" },
        },
      },
    },
  },

  /**
   * Upload translation file (multipart/form-data)
   * POST /api/v1/translations/upload
   * Body: multipart/form-data with 'file' and 'lang' fields
   * Admin only
   */
  {
    path: "/upload",
    controller: { post: controller.uploadTranslationFile },
    middlewares: {
      post: [
        authenticateToken,
        requireRole(["admin"]) as any,
        requireUploadInput as any,
      ],
    },
    docs: {
      post: {
        summary: "Upload translation JSON file (Admin only)",
        tags: ["Translations", "Admin"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "JSON translation file (e.g., en.json, fr.json)",
                  },
                  lang: {
                    type: "string",
                    description: "2-letter language code (e.g., 'en', 'fr', 'es')",
                    example: "en",
                  },
                  type: {
                    type: "string",
                    enum: ["mobile", "admin", "backend"],
                    description: "Translation type: mobile, admin, or backend (default: mobile)",
                    example: "mobile",
                  },
                },
                required: ["file", "lang"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Translation file uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        lang: { type: "string" },
                        type: { type: "string" },
                        fileName: { type: "string" },
                        allFiles: {
                          type: "array",
                          items: { type: "string" },
                          description: "List of all available translation file names",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Bad request - invalid file or missing parameters" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  },

  /**
   * List available translation files
   * GET /api/v1/translations/files
   * Admin only
   */
  {
    path: "/files/all",
    controller: { get: controller.listTranslationFiles },
    middlewares: {
      get: [authenticateToken, requireRole(["admin"]) as any],
    },
    docs: {
      get: {
        summary: "List all available translation files (Admin only)",
        tags: ["Translations", "Admin"],
        responses: {
          200: {
            description: "List of translation files",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        files: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              lang: { type: "string" },
                              fileName: { type: "string" },
                              lastModified: { type: "string" },
                              size: { type: "number" },
                            },
                          },
                        },
                        count: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  },

];

export default routes;

