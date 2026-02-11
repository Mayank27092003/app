import { UserController } from "../../controllers/user";
import { buildValidator, validate } from "../../middlewares/validate";
import { createUserSchema } from "../../validators/user.schema";
import { authenticateToken } from "../../middlewares/authentication";
import { uploadSingle } from "../../middlewares/upload";
import { requireUploadInput } from "../../middlewares/requireUploadInput";
import uploadController from "../../controllers/upload";
import type { RouteDefinition } from "../types";
import { getProfileDoc, updateProfileDoc } from "./swagger/profile.swagger";

const controller = new UserController();

const userRoutes: RouteDefinition[] = [
  {
    path: "/",
    controller: {
      get: controller.get,
      post: controller.post,
    },
    validators: {
      post: validate(buildValidator(createUserSchema)), // ✅ wrap it properly
    },
    middlewares: {
      get: [authenticateToken],
    },
    docs: {
      get: {
        summary: "Get all users",
        tags: ["User"],
        parameters: [
          {
            name: "userName",
            in: "query",
            description: "Filter by username",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "role",
            in: "query",
            description: "Filter by role name (e.g., 'shipper', 'carrier', 'driver')",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "ownCompany",
            in: "query",
            description: "If true, show only users who are members of the logged-in user's companies. Requires authentication.",
            required: false,
            schema: { type: "string", enum: ["true", "false"], default: "false" },
          },
          {
            name: "excludeCompany",
            in: "query",
            description: "If true and authenticated, show users who are NOT in the logged-in user's companies (users in other companies will still be shown). If not authenticated, show users not in any company. Requires authentication to filter by logged-in user's companies.",
            required: false,
            schema: { type: "string", enum: ["true", "false"], default: "false" },
          },
          {
            name: "verificationStatus",
            in: "query",
            description: "Filter by verification status",
            required: false,
            schema: {
              type: "string",
              enum: [
                "pending",
                "profile_complete",
                "documents_verified",
                "admin_verified",
                "fully_verified",
                "suspended",
                "rejected",
              ],
            },
            examples: {
              pending: { value: "pending", summary: "Pending verification" },
              profile_complete: { value: "profile_complete", summary: "Profile complete" },
              documents_verified: { value: "documents_verified", summary: "Documents verified" },
              admin_verified: { value: "admin_verified", summary: "Admin verified" },
              fully_verified: { value: "fully_verified", summary: "Fully verified" },
              suspended: { value: "suspended", summary: "Suspended" },
              rejected: { value: "rejected", summary: "Rejected" },
            },
          },
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
            description: "Number of users per page",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "sortBy",
            in: "query",
            description: "Column to sort by",
            required: false,
            schema: {
              type: "string",
              enum: ["createdAt", "updatedAt", "userName", "email", "firstName", "lastName", "verificationStatus"],
              default: "createdAt",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            description: "Sort order (asc or desc)",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
          {
            name: "lat",
            in: "query",
            description: "Latitude for location-based filtering",
            required: false,
            schema: { type: "number", format: "float" },
          },
          {
            name: "lng",
            in: "query",
            description: "Longitude for location-based filtering",
            required: false,
            schema: { type: "number", format: "float" },
          },
          {
            name: "radius",
            in: "query",
            description: "Search radius in miles (default: 50 miles). Example: 50 = 50 miles, 100 = 100 miles",
            required: false,
            schema: { type: "number", format: "float", default: 50, example: 50 },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          fullName: { type: "string" },
                          userName: { type: "string" },
                          email: { type: "string", format: "email" },
                          roles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                roleId: { type: "integer" },
                                roleName: { type: "string" },
                              },
                            },
                          },
                          company: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "integer" },
                              name: { type: "string" },
                            },
                          },
                          driver: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "integer" },
                              licenseNumber: { type: "string" },
                            },
                          },
                          location: {
                            type: "object",
                            nullable: true,
                            description: "User's current location",
                            properties: {
                              id: { type: "integer" },
                              userId: { type: "integer" },
                              lat: { type: "number", format: "float" },
                              lng: { type: "number", format: "float" },
                              accuracy: { type: ["number", "null"], format: "float" },
                              heading: { type: ["number", "null"], format: "float" },
                              speed: { type: ["number", "null"], format: "float" },
                              provider: { type: ["string", "null"] },
                              battery: { type: ["integer", "null"] },
                              createdAt: { type: ["string", "null"], format: "date-time" },
                            },
                          },
                          distance: {
                            type: "number",
                            format: "float",
                            description: "Distance in miles from the provided lat/lng (only present when lat/lng filter is used)",
                            nullable: true,
                          },
                        },
                      },
                    },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalUsers: { type: "integer" },
                    totalPages: { type: "integer" },
                    counts: {
                      type: "object",
                      properties: {
                        pending: {
                          type: "integer",
                          description: "Number of users with pending verification status",
                        },
                        active: {
                          type: "integer",
                          description: "Number of users with active verification status (profile_complete, documents_verified, admin_verified, fully_verified)",
                        },
                        suspended: {
                          type: "integer",
                          description: "Number of users with suspended status",
                        },
                      },
                    },
                    city: {
                      type: "object",
                      nullable: true,
                      description: "City information based on provided lat/lng (only present when lat/lng filter is used)",
                      properties: {
                        name: { type: "string" },
                        countryCode: { type: "string" },
                        stateCode: { type: "string" },
                        latitude: { type: "string" },
                        longitude: { type: "string" },
                        country: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            isoCode: { type: "string" },
                          },
                        },
                        state: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            isoCode: { type: "string" },
                          },
                        },
                        distance: { type: "number", format: "float", description: "Distance in miles from the provided coordinates" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new user",
        tags: ["User"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
          },
          400: {
            description: "Invalid input",
          },
        },
      },
    },
  },
  {
    path: "/:id/profile",
    controller: {
      get: controller.getProfileById,
    },
    docs: {
      get: {
        summary: "Get user profile by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        // Basic user info
                        id: { type: "integer", example: 1 },
                        firstName: { type: "string", example: "John" },
                        middleName: {
                          type: ["string", "null"],
                          example: "Michael",
                        },
                        lastName: { type: "string", example: "Doe" },
                        fullName: {
                          type: "string",
                          example: "John Michael Doe",
                        },
                        userName: { type: "string", example: "johndoe" },
                        email: { type: "string", example: "john@example.com" },
                        profileImage: {
                          type: ["string", "null"],
                          example: "https://example.com/image.jpg",
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
    
                        // Email verification
                        isEmailVerified: { type: "boolean", example: true },
                        emailVerifiedAt: {
                          type: ["string", "null"],
                          format: "date-time",
                        },
    
                        // Verification status
                        verification: {
                          type: "object",
                          properties: {
                            userId: { type: "integer", example: 1 },
                            currentStatus: {
                              type: "string",
                              example: "profile_complete",
                            },
                            lastUpdated: {
                              type: "string",
                              format: "date-time",
                            },
                            verificationNotes: { type: ["string", "null"] },
                            isFullyVerified: {
                              type: "boolean",
                              example: false,
                            },
                            steps: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  step: {
                                    type: "string",
                                    example: "Email Verification",
                                  },
                                  status: {
                                    type: "string",
                                    example: "completed",
                                  },
                                  completedAt: {
                                    type: ["string", "null"],
                                    format: "date-time",
                                  },
                                },
                              },
                            },
                          },
                        },
    
                        // Roles and permissions
                        roles: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              role: {
                                type: "object",
                                properties: {
                                  id: { type: "integer", example: 1 },
                                  name: { type: "string", example: "driver" },
                                  description: {
                                    type: "string",
                                    example: "Professional driver",
                                  },
                                  isCompanyRole: {
                                    type: "boolean",
                                    example: false,
                                  },
                                  jobPostFee: { type: "integer", example: 0 },
                                  sortOrder: { type: "integer", example: 0 },
                                },
                              },
                              sortOrder: { type: "integer", example: 0 },
                              assignedAt: {
                                type: "string",
                                format: "date-time",
                              },
                            },
                          },
                        },
    
                        // Documents
                        documents: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              documentType: {
                                type: "object",
                                properties: {
                                  id: { type: "integer", example: 1 },
                                  name: {
                                    type: "string",
                                    example: "Driver License",
                                  },
                                  description: {
                                    type: "string",
                                    example: "Valid driver license",
                                  },
                                  requiresExpiry: {
                                    type: "boolean",
                                    example: true,
                                  },
                                },
                              },
                              fileUrl: {
                                type: "string",
                                example: "https://example.com/license.pdf",
                              },
                              expiryDate: {
                                type: ["string", "null"],
                                format: "date",
                              },
                              verified: { type: "boolean", example: true },
                              createdAt: {
                                type: "string",
                                format: "date-time",
                              },
                              updatedAt: {
                                type: "string",
                                format: "date-time",
                              },
                            },
                          },
                        },
    
                        // Company information
                        company: {
                          type: ["object", "null"],
                          properties: {
                            id: { type: "integer", example: 1 },
                            companyName: {
                              type: "string",
                              example: "ABC Logistics",
                            },
                            industryType: {
                              type: ["string", "null"],
                              example: "Logistics",
                            },
                            contactNumber: {
                              type: ["string", "null"],
                              example: "+1234567890",
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
    
                        // Company memberships
                        companyMemberships: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              company: {
                                type: "object",
                                properties: {
                                  id: { type: "integer", example: 1 },
                                  companyName: {
                                    type: "string",
                                    example: "XYZ Transport",
                                  },
                                  industryType: {
                                    type: ["string", "null"],
                                    example: "Transport",
                                  },
                                  contactNumber: {
                                    type: ["string", "null"],
                                    example: "+1234567890",
                                  },
                                },
                              },
                              roleId: {
                                type: ["integer", "null"],
                                example: 1,
                                description: "ID of the role in the company",
                              },
                              role: {
                                type: ["object", "null"],
                                description: "Role details",
                                properties: {
                                  id: { type: "integer", example: 1 },
                                  name: { type: "string", example: "Manager" },
                                  description: { type: "string", example: "Company manager role" },
                                },
                              },
                              isPrimary: { type: "boolean", example: true },
                            },
                          },
                        },
    
                        // Driver information
                        driver: {
                          type: ["object", "null"],
                          properties: {
                            id: { type: "integer", example: 1 },
                            licenseNumber: {
                              type: "string",
                              example: "DL123456789",
                            },
                            twicNumber: {
                              type: ["string", "null"],
                              example: "TWIC123456",
                            },
                            medicalCertificate: {
                              type: ["string", "null"],
                              example: "MED123456",
                            },
                            drugTestResult: {
                              type: ["string", "null"],
                              example: "DRUG123456",
                            },
                            verified: { type: "boolean", example: true },
                            workRadius: {
                              type: ["integer", "null"],
                              example: 50,
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
    
                        // Verification metadata
                        verifiedBy: {
                          type: ["object", "null"],
                          properties: {
                            id: { type: "integer", example: 1 },
                            fullName: { type: "string", example: "Admin User" },
                            email: {
                              type: "string",
                              example: "admin@example.com",
                            },
                          },
                        },
    
                        // Location data
                        location: {
                          type: ["object", "null"],
                          description: "User's current location",
                          properties: {
                            id: { type: "integer", example: 1 },
                            userId: { type: "integer", example: 1 },
                            lat: { type: "number", format: "float", example: 40.7128 },
                            lng: { type: "number", format: "float", example: -74.0060 },
                            accuracy: { type: ["number", "null"], format: "float", example: 5.2 },
                            heading: { type: ["number", "null"], format: "float", example: 180 },
                            speed: { type: ["number", "null"], format: "float", example: 65.5 },
                            provider: { type: ["string", "null"], example: "gps" },
                            battery: { type: ["integer", "null"], example: 85 },
                            createdAt: { type: ["string", "null"], format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "User not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  {
    path: "/:id",
    controller: {
      put: controller.put,
      delete: controller.delete,
    },
    docs: {
      put: {
        summary: "Update user by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User updated successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
      delete: {
        summary: "Delete user by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          204: {
            description: "User deleted successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
    },
  },
];

export default userRoutes;
