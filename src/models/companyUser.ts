import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Company } from "./companies";
import { Role } from "./roles";

export class CompanyUser extends Model {
  id!: number;
  companyId!: number;
  userId!: number;
  isPrimary!: boolean;
  roleId!: number | null;
  
  // Relations
  company?: Company;
  user?: User;
  role?: Role;

  static tableName = "companyUsers";

  static jsonSchema = {
    type: "object",
    required: ["companyId", "userId"],
    properties: {
      id: { type: "integer" },
      companyId: { type: "integer" },
      userId: { type: "integer" },
      isPrimary: { type: "boolean" },
      roleId: { type: ["integer", "null"] }
    }
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "companyUsers.userId",
        to: "users.id"
      }
    },
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: "companyUsers.companyId",
        to: "companies.id"
      }
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: {
        from: "companyUsers.roleId",
        to: "roles.id"
      }
    }
  });
}
