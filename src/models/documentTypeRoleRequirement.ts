import { Model, RelationMappings } from "objection";
import { DocumentType } from "./documentType";
import { Role } from "./roles";

/** ---------- DOCUMENT TYPE ROLE REQUIREMENTS ---------- */
export class DocumentTypeRoleRequirement extends Model {
  id!: number;
  documentTypeId!: number;
  roleId!: number;
  sortOrder!: number;
  isOptional!: boolean;

  documentType?: DocumentType;
  role?: Role;

  static tableName = "documentTypeRoleRequirements";

  static jsonSchema = {
    type: "object",
    required: ["documentTypeId", "roleId"],
    properties: {
      id: { type: "integer" },
      documentTypeId: { type: "integer" },
      roleId: { type: "integer" },
      sortOrder: { type: "integer" },
      isOptional: { type: "boolean" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    documentType: {
      relation: Model.BelongsToOneRelation,
      modelClass: DocumentType,
      join: { from: "documentTypeRoleRequirements.documentTypeId", to: "documentTypes.id" },
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "documentTypeRoleRequirements.roleId", to: "roles.id" },
    },
  });
}
