import { Model } from "objection";
import { Role } from "./roles";

export class RoleVisibilityPermission extends Model {
  id!: number;
  fromRoleId!: number;
  visibleToRoleId!: number;
  createdAt?: string;

  static tableName = "roleVisibilityPermissions";

  static jsonSchema = {
    type: "object",
    required: ["fromRoleId", "visibleToRoleId"],
    properties: {
      id: { type: "integer" },
      fromRoleId: { type: "integer" },
      visibleToRoleId: { type: "integer" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = {
    fromRole: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "roleVisibilityPermissions.fromRoleId", to: "roles.id" },
    },
    toRole: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "roleVisibilityPermissions.visibleToRoleId", to: "roles.id" },
    },
  };
}
