import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Role } from "./roles";

export class UserRole extends Model {
  id!: number;
  userId!: number;
  roleId!: number;
  sortOrder!: number;
  assignedAt?: string;
  
  // Relations
  role?: Role;

  static tableName = "userRoles";

  static jsonSchema = {
    type: "object",
    required: ["userId", "roleId"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      roleId: { type: "integer" },
      sortOrder: { type: "integer" },
      assignedAt: { type: ["string", "null"] }
    }
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "userRoles.userId",
        to: "users.id"
      }
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: {
        from: "userRoles.roleId",
        to: "roles.id"
      }
    }
  });
}
