import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { DocumentType } from "./documentType";

/** ---------- DOCUMENTS ---------- */
export class Document extends Model {
  id!: number;
  userId!: number;
  documentTypeId!: number;
  fileUrl?: string | null;
  textValue?: string | null;
  side?: "front" | "back" | null;
  status!: string;
  expiryDate?: string;
  verified!: boolean;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  verifiedBy?: number | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  user?: User;
  documentType?: DocumentType;
  verifiedByUser?: User;
  rejectedByUser?: User;

  static tableName = "documents";

  static jsonSchema = {
    type: "object",
    required: ["userId", "documentTypeId"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      documentTypeId: { type: "integer" },
      fileUrl: { type: ["string", "null"] },
      textValue: { type: ["string", "null"] },
      side: { type: ["string", "null"], enum: ["front", "back", null] },
      status: { type: "string" },
      expiryDate: { type: ["string", "null"] },
      verified: { type: "boolean" },
      verifiedAt: { type: ["string", "null"] },
      rejectedAt: { type: ["string", "null"] },
      verifiedBy: { type: ["integer", "null"] },
      rejectedBy: { type: ["integer", "null"] },
      rejectionReason: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "documents.userId", to: "users.id" },
    },
    documentType: {
      relation: Model.BelongsToOneRelation,
      modelClass: DocumentType,
      join: { from: "documents.documentTypeId", to: "documentTypes.id" },
    },
    verifiedByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "documents.verifiedBy", to: "users.id" },
    },
    rejectedByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "documents.rejectedBy", to: "users.id" },
    },
  });
}
