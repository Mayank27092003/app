import { Model, RelationMappings } from "objection";
import { Document } from "./document";
import { DocumentTypeRoleRequirement } from "./documentTypeRoleRequirement";

/** ---------- DOCUMENT TYPES ---------- */
export class DocumentType extends Model {
  id!: number;
  name!: string;
  displayName!:string;
  description?: string;
  requiresExpiry!: boolean;
  requiresSides!: boolean;
  acceptsTextInput!: boolean;
  createdAt?: string;

  documents?: Document[];
  roleRequirements?: DocumentTypeRoleRequirement[];

  static tableName = "documentTypes";

  static jsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      displayName: { type: "string" },
      description: { type: ["string", "null"] },
      requiresExpiry: { type: "boolean" },
      requiresSides: { type: "boolean" },
      acceptsTextInput: { type: "boolean" },
      createdAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    documents: {
      relation: Model.HasManyRelation,
      modelClass: Document,
      join: { from: "documentTypes.id", to: "documents.documentTypeId" },
    },
    roleRequirements: {
      relation: Model.HasManyRelation,
      modelClass: DocumentTypeRoleRequirement,
      join: { from: "documentTypes.id", to: "documentTypeRoleRequirements.documentTypeId" },
    },
  });
}
