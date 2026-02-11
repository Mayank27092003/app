import { JSONSchemaType } from "ajv";

export interface DocumentUploadRequest {
  documentTypeId: number;
  fileUrl?: string;
  textValue?: string;
  side?: "front" | "back" | null;
  expiryDate?: string;
}

export interface DocumentVerificationRequest {
  verified: boolean;
}

export const documentUploadSchema: JSONSchemaType<DocumentUploadRequest> = {
  type: "object",
  required: ["documentTypeId"],
  properties: {
    documentTypeId: {
      type: "integer",
      minimum: 1,
      description: "ID of the document type",
    },
    fileUrl: {
      type: "string",
      minLength: 1,
      format: "uri",
      nullable: true,
      description: "URL of the uploaded file (required if document type doesn't accept text input)",
    },
    textValue: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      nullable: true,
      description: "Text input value (required if document type accepts text input, e.g., SSN)",
    },
    side: {
      type: "string",
      enum: ["front", "back"],
      nullable: true,
      description: "Document side: 'front' or 'back' (required for document types that require sides)",
    },
    expiryDate: {
      type: "string",
      format: "date",
      nullable: true,
      description: "Expiry date (optional)",
    },
  },
  additionalProperties: false,
};

export const documentVerificationSchema: JSONSchemaType<DocumentVerificationRequest> = {
  type: "object",
  required: ["verified"],
  properties: {
    verified: {
      type: "boolean",
      description: "Whether to verify the document",
    },
  },
  additionalProperties: false,
};
