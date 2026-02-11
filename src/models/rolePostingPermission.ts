import { Model, RelationMappings } from "objection";
import { Role } from "./roles";

export class RolePostingPermission extends Model {
  id!: number;
  posterRoleId!: number;
  viewerRoleId!: number;
  createdAt?: string;
  updatedAt?: string;

  posterRole?: Role;
  viewerRole?: Role;

  static tableName = "rolePostingPermissions";

  static jsonSchema = {
    type: "object",
    required: ["posterRoleId", "viewerRoleId"],
    properties: {
      id: { type: "integer" },
      posterRoleId: { type: "integer" },
      viewerRoleId: { type: "integer" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    posterRole: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "rolePostingPermissions.posterRoleId", to: "roles.id" },
    },
    viewerRole: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "rolePostingPermissions.viewerRoleId", to: "roles.id" },
    },
  });
}
