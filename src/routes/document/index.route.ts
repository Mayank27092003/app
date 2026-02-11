import { DocumentController } from "../../controllers/document";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import { useValidator } from "../../middlewares/validate";
import { documentUploadSchema, documentVerificationSchema } from "../../validators/document.schema";

const controller = new DocumentController();

export default [
  // Upload document (authenticated users)
  {
    path: "/upload",
    controller: { post: controller.uploadDocument },
    validators: { post: useValidator(documentUploadSchema) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Upload a document",
        tags: ["Documents"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["documentTypeId"],
                properties: {
                  documentTypeId: { type: "integer", description: "ID of the document type" },
                  fileUrl: { type: "string", description: "URL of the uploaded file (required if document type doesn't accept text input)" },
                  textValue: { type: "string", description: "Text input value (required if document type accepts text input, e.g., SSN)" },
                  side: { type: "string", enum: ["front", "back"], description: "Document side: 'front' or 'back' (required for document types that require sides)" },
                  expiryDate: { type: "string", format: "date", description: "Expiry date (optional)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document uploaded successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get required documents for user (authenticated users)
  {
    path: "/required",
    controller: { get: controller.getRequiredDocuments },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get required documents for the authenticated user",
        tags: ["Documents"],
        responses: {
          200: { description: "Required documents retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get user's uploaded documents (authenticated users)
  {
    path: "/my",
    controller: { get: controller.getUserDocuments },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get user's uploaded documents",
        tags: ["Documents"],
        responses: {
          200: { description: "User documents retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Delete document (authenticated users - users can delete their own, admins can delete any)
  {
    path: "/:id",
    controller: { delete: controller.deleteDocument },
    middlewares: { delete: [authenticateToken] },
    docs: {
      delete: {
        summary: "Delete a document (users can delete their own, admins can delete any)",
        tags: ["Documents"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document ID",
          },
        ],
        responses: {
          200: { description: "Document deleted successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - can only delete your own documents (unless admin)" },
          404: { description: "Document not found" },
        },
      },
    },
  },

  // Verify document (admin function)
  {
    path: "/:id/verify",
    controller: { patch: controller.verifyDocument },
    validators: { patch: useValidator(documentVerificationSchema) },
    middlewares: { patch: [authenticateToken, requireRole(["admin"])] },
    docs: {
      patch: {
        summary: "Verify or unverify a document (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["verified"],
                properties: {
                  verified: { type: "boolean", description: "Whether to verify the document" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Document verification status updated" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document not found" },
        },
      },
    },
  },

  // Reject document (admin function)
  {
    path: "/:id/reject",
    controller: { patch: controller.rejectDocument },
    middlewares: { patch: [authenticateToken, requireRole(["admin"])] },
    docs: {
      patch: {
        summary: "Reject a document (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rejectionReason: { type: "string", description: "Reason for rejection (optional)" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Document rejected successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document not found" },
        },
      },
    },
  },

  // Get all documents with full details (admin only)
  {
    path: "/all",
    controller: { get: controller.getAllDocuments },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get all documents with full details (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of documents per page",
            required: false,
            schema: { type: "integer", default: 50 },
          },
          {
            name: "userId",
            in: "query",
            description: "Filter by user ID",
            required: false,
            schema: { type: "integer" },
          },
          {
            name: "documentTypeId",
            in: "query",
            description: "Filter by document type ID",
            required: false,
            schema: { type: "integer" },
          },
          {
            name: "verified",
            in: "query",
            description: "Filter by verification status",
            required: false,
            schema: { type: "boolean" },
          },
          {
            name: "status",
            in: "query",
            description: "Filter by document status",
            required: false,
            schema: {
              type: "string",
              enum: ["verified", "rejected", "pending", "expired"],
            },
            examples: {
              verified: { value: "verified", summary: "Verified documents" },
              rejected: { value: "rejected", summary: "Rejected documents" },
              pending: { value: "pending", summary: "Pending verification" },
              expired: { value: "expired", summary: "Expired documents" },
            },
          },
          {
            name: "search",
            in: "query",
            description: "Fuzzy search across username, user email, document type name, and document type display name",
            required: false,
            schema: { type: "string" },
            example: "john@example.com",
          },
          {
            name: "sortBy",
            in: "query",
            description: "Sort field (createdAt, updatedAt, verifiedAt, rejectedAt)",
            required: false,
            schema: { 
              type: "string",
              enum: ["createdAt", "updatedAt", "verifiedAt", "rejectedAt"],
              default: "createdAt"
            },
          },
          {
            name: "sortOrder",
            in: "query",
            description: "Sort order",
            required: false,
            schema: { 
              type: "string",
              enum: ["asc", "desc"],
              default: "desc"
            },
          },
        ],
        responses: {
          200: {
            description: "Documents retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        documents: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              userId: { type: "integer" },
                              documentTypeId: { type: "integer" },
                              fileUrl: { type: "string" },
                              expiryDate: { type: ["string", "null"] },
                              verified: { type: "boolean" },
                              verifiedAt: { type: ["string", "null"] },
                              rejectedAt: { type: ["string", "null"] },
                              verifiedBy: { type: ["integer", "null"] },
                              rejectedBy: { type: ["integer", "null"] },
                              rejectionReason: { type: ["string", "null"] },
                              createdAt: { type: "string" },
                              updatedAt: { type: "string" },
                              user: {
                                type: "object",
                                properties: {
                                  id: { type: "integer" },
                                  firstName: { type: "string" },
                                  lastName: { type: "string" },
                                  fullName: { type: "string" },
                                  email: { type: "string" },
                                  userName: { type: "string" },
                                },
                              },
                              documentType: {
                                type: "object",
                                properties: {
                                  id: { type: "integer" },
                                  name: { type: "string" },
                                  displayName: { type: "string" },
                                  description: { type: ["string", "null"] },
                                  requiresExpiry: { type: "boolean" },
                                },
                              },
                              verifiedByUser: {
                                type: ["object", "null"],
                                nullable: true,
                                properties: {
                                  id: { type: "integer" },
                                  firstName: { type: "string" },
                                  lastName: { type: "string" },
                                  fullName: { type: "string" },
                                  email: { type: "string" },
                                },
                              },
                              rejectedByUser: {
                                type: ["object", "null"],
                                nullable: true,
                                properties: {
                                  id: { type: "integer" },
                                  firstName: { type: "string" },
                                  lastName: { type: "string" },
                                  fullName: { type: "string" },
                                  email: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                        total: { type: "integer", description: "Total documents matching filters" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" },
                        counts: {
                          type: "object",
                          description: "Document counts by status",
                          properties: {
                            total: { type: "integer", description: "Total documents (excluding deleted)" },
                            verified: { type: "integer", description: "Number of verified documents" },
                            rejected: { type: "integer", description: "Number of rejected documents" },
                            pending: { type: "integer", description: "Number of pending documents" },
                            expired: { type: "integer", description: "Number of expired documents" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Get all document types (public)
  {
    path: "/types",
    controller: { get: controller.getDocumentTypes },
    docs: {
      get: {
        summary: "Get all document types",
        tags: ["Documents"],
        parameters: [
          {
            name: "roleId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Role ID - if provided with filterByRole=true, only returns document types assigned to this role. If provided without filterByRole, includes isOptional field for this role.",
          },
          {
            name: "filterByRole",
            in: "query",
            required: false,
            schema: { type: "boolean" },
            description: "If true and roleId is provided, only returns document types that are assigned to the specified role.",
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Search term to filter document types by name or displayName (case-insensitive).",
          },
        ],
        responses: {
          200: { description: "Document types retrieved successfully" },
        },
      },
    },
  },

  // Create document type (admin function)
  {
    path: "/types",
    controller: { post: controller.createDocumentType },
    middlewares: { post: [authenticateToken, requireRole(["admin"])] },
    docs: {
      post: {
        summary: "Create a new document type (admin only)",
        tags: ["Documents", "Admin"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", description: "Unique name of the document type (used as translation key)" },
                  displayName: { type: "string", description: "Display name shown on frontend (optional, defaults to name)" },
                  description: { type: "string", description: "Description (optional)" },
                  requiresExpiry: { type: "boolean", description: "Whether expiry date is required (default: true)" },
                  requiresSides: { type: "boolean", description: "Whether document requires front/back sides (default: false)" },
                  acceptsTextInput: { type: "boolean", description: "Whether document accepts text input instead of file (default: false)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document type created successfully" },
          400: { description: "Bad request - missing required fields or duplicate name" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Update document type (admin function)
  {
    path: "/types/:id",
    controller: { patch: controller.updateDocumentType },
    middlewares: { patch: [authenticateToken, requireRole(["admin"])] },
    docs: {
      patch: {
        summary: "Update a document type (admin only) - name cannot be changed",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", description: "Display name shown on frontend" },
                  description: { type: "string", description: "Description" },
                  requiresExpiry: { type: "boolean", description: "Whether expiry date is required" },
                  requiresSides: { type: "boolean", description: "Whether document requires front/back sides" },
                  acceptsTextInput: { type: "boolean", description: "Whether document accepts text input instead of file" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Document type updated successfully" },
          400: { description: "Bad request - invalid ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type not found" },
        },
      },
    },
  },

  // Delete document type (admin function)
  {
    path: "/types/:id",
    controller: { delete: controller.deleteDocumentType },
    middlewares: { delete: [authenticateToken, requireRole(["admin"])] },
    docs: {
      delete: {
        summary: "Delete a document type (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
        ],
        responses: {
          200: { description: "Document type deleted successfully" },
          400: { description: "Bad request - invalid ID or documents exist using this type" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type not found" },
        },
      },
    },
  },

  // Get role requirements for a document type (admin function)
  {
    path: "/types/:id/roles",
    controller: { get: controller.getDocumentTypeRoleRequirements },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get role requirements for a document type (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
        ],
        responses: {
          200: { description: "Role requirements retrieved successfully" },
          400: { description: "Bad request - invalid ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type not found" },
        },
      },
    },
  },

  // Assign document type to role (admin function)
  {
    path: "/types/:documentTypeId/roles/:roleId",
    controller: { post: controller.assignDocumentTypeToRole },
    middlewares: { post: [authenticateToken, requireRole(["admin"])] },
    docs: {
      post: {
        summary: "Assign document type requirement to a role (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "documentTypeId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sortOrder: { type: "integer", description: "Sort order (default: 0)" },
                  isOptional: { type: "boolean", description: "Whether this document is optional for the role (default: false)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document type requirement assigned to role successfully" },
          400: { description: "Bad request - invalid IDs" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type or role not found" },
        },
      },
    },
  },

  // Update/Remove document type requirement (admin function)
  {
    path: "/types/:documentTypeId/roles/:roleId",
    controller: { 
      patch: controller.updateDocumentTypeRoleRequirement,
      delete: controller.removeDocumentTypeFromRole 
    },
    middlewares: { 
      patch: [authenticateToken, requireRole(["admin"])],
      delete: [authenticateToken, requireRole(["admin"])] 
    },
    docs: {
      patch: {
        summary: "Update document type requirement (sortOrder, isOptional) (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "documentTypeId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sortOrder: { type: "integer", description: "Sort order" },
                  isOptional: { type: "boolean", description: "Whether this document is optional" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Document type requirement updated successfully" },
          400: { description: "Bad request - invalid IDs or missing fields" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type requirement not found" },
        },
      },
      delete: {
        summary: "Remove document type requirement from a role (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "documentTypeId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        responses: {
          200: { description: "Document type requirement removed from role successfully" },
          400: { description: "Bad request - invalid IDs" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document type requirement not found" },
        },
      },
    },
  },

  // Get all document requirements for a specific role (admin function)
  {
    path: "/roles/:roleId/requirements",
    controller: { get: controller.getRoleDocumentRequirements },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get all document requirements for a specific role (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        responses: {
          200: { description: "Role document requirements retrieved successfully" },
          400: { description: "Bad request - invalid role ID" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },
];
