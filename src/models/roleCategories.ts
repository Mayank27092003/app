import { Model, RelationMappings } from "objection";
import { Role } from "./roles";
import { CompanyType } from "./companyType";

export class RoleCategory extends Model {
  id!: number;
  name!: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;

  roles?: Role[];
  companyTypes?: CompanyType[];

  static tableName = "roleCategories";

  static jsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    roles: {
      relation: Model.HasManyRelation,
      modelClass: Role,
      join: { from: "roleCategories.id", to: "roles.categoryId" },
    },
    companyTypes: {
      relation: Model.HasManyRelation,
      modelClass: CompanyType,
      join: { from: "roleCategories.id", to: "companyTypes.roleCategoryId" },
    },
  });
}
