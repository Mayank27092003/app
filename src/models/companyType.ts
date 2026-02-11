import { Model, RelationMappings } from "objection";
import { RoleCategory } from "./roleCategories";

export class CompanyType extends Model {
  id!: number;
  name!: string;
  description?: string;
  roleCategoryId!: number;
  createdAt?: string;
  updatedAt?: string;

  roleCategory?: RoleCategory;

  static tableName = "companyTypes";

  static jsonSchema = {
    type: "object",
    required: ["name", "roleCategoryId"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      roleCategoryId: { type: "integer" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    roleCategory: {
      relation: Model.BelongsToOneRelation,
      modelClass: RoleCategory,
      join: { from: "companyTypes.roleCategoryId", to: "roleCategories.id" },
    },
  });
}
