import { JSONSchemaType } from "ajv";
import { FromSchema } from "json-schema-to-ts";

export interface CreateUserDTO {
  // name: string;
}

export const createUserSchema: JSONSchemaType<CreateUserDTO> = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {},
};

// Update User Verification Status Schema (Admin)
export const updateUserVerificationStatusSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
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
      description: "New verification status for the user",
    },
    notes: {
      type: "string",
      maxLength: 1000,
      description: "Optional notes about the verification decision",
    },
  },
  additionalProperties: false,
} as const;

// Check Verification Requirements Schema
export const checkVerificationRequirementsSchema = {
  type: "object",
  required: ["requiredStatus"],
  properties: {
    requiredStatus: {
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
      description: "Required verification status for the action",
    },
  },
  additionalProperties: false,
} as const;

// Update Profile Schema
export const updateProfileSchema = {
  type: "object",
  properties: {
    userName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      description: "User's username",
    },
    phoneNumber: {
      type: ["string", "null"],
      maxLength: 20,
      description: "User's phone number",
    },
    phoneCountryCode: {
      type: ["string", "null"],
      maxLength: 4,
      description: "User's phone country code (e.g. +1, +91)",
    },
    profileImage: {
      type: ["string", "null"],
      format: "uri",
      description: "URL to user's profile image",
    },
    company: {
      type: ["object", "null"],
      properties: {
        companyName: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          description: "Company name",
        },
        industryType: {
          type: ["string", "null"],
          maxLength: 100,
          description: "Industry type",
        },
        contactNumber: {
          type: ["string", "null"],
          maxLength: 20,
          description: "Company contact number",
        },
        phoneNumber: {
          type: ["string", "null"],
          maxLength: 20,
          description: "Company phone number",
        },
        address: {
          type: ["string", "null"],
          maxLength: 255,
          description: "Company street address",
        },
        country: {
          type: ["string", "null"],
          maxLength: 100,
          description: "Company country",
        },
        state: {
          type: ["string", "null"],
          maxLength: 100,
          description: "Company state/province",
        },
        city: {
          type: ["string", "null"],
          maxLength: 100,
          description: "Company city",
        },
        zipCode: {
          type: ["string", "null"],
          maxLength: 20,
          description: "Company zip/postal code",
        },
      },
      additionalProperties: false,
    },
    driver: {
      type: ["object", "null"],
      properties: {
        licenseNumber: {
          type: "string",
          minLength: 1,
          maxLength: 50,
          description: "Driver's license number",
        },
        drivingLicenseExpiresAt: {
          type: ["string", "null"],
          format: "date",
          description: "Driver license expiry date",
        },
        workRadius: {
          type: ["integer", "null"],
          minimum: 1,
          maximum: 1000,
          description: "Driver's optional work radius in kilometers",
        },
      },
      additionalProperties: false,
    },
    trucks: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          truckTypeId: {
            type: "integer",
            description: "Truck type ID",
          },
          capacity: {
            type: "string",
            maxLength: 50,
            description: "Truck capacity",
          },
          capacityUnit: {
            type: "string",
            maxLength: 20,
            description: "Capacity unit (e.g. ft, tons)",
          },
          isPrimary: {
            type: "boolean",
            description: "Whether this is the primary truck",
          },
          label: {
            type: ["string", "null"],
            maxLength: 100,
            description: "Custom truck label",
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
} as const;

// Get Pending Verifications Schema (Admin)
export const getPendingVerificationsSchema = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 50,
      description: "Number of records to return",
    },
    offset: {
      type: "integer",
      minimum: 0,
      default: 0,
      description: "Number of records to skip",
    },
  },
  additionalProperties: false,
} as const;

// ========== Types ==========
export type UpdateUserVerificationStatusInput = FromSchema<
  typeof updateUserVerificationStatusSchema
>;
export type CheckVerificationRequirementsInput = FromSchema<
  typeof checkVerificationRequirementsSchema
>;
export type GetPendingVerificationsInput = FromSchema<
  typeof getPendingVerificationsSchema
>;
export type UpdateProfileInput = FromSchema<typeof updateProfileSchema>;
