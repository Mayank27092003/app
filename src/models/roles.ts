import { Model, RelationMappings } from "objection";
import { UserRole } from "./userRole";
import { JobVisibilityRole } from "./jobVisibilityRole";
import { RoleVisibilityPermission } from "./roleVisibilityPermission";
import { JobPostingFee } from "./jobPostingFees";
import { RoleCommission } from "./roleCommission";


export class Role extends Model {
  id!: number;
  name!: string;
  description?: string;
  isCompanyRole!: boolean;
  jobPostFee!: number;
  sortOrder!: number;
  createdAt?: string;

  static tableName = "roles";

  static jsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      description: { type: "string" },
      isCompanyRole: { type: "boolean" },
      jobPostFee: { type: "integer" },
      sortOrder: { type: "integer" },
      createdAt: { type: "string", format: "date-time" }
    }
  };

  static relationMappings = (): RelationMappings => ({
    userRoles: {
      relation: Model.HasManyRelation,
      modelClass: UserRole,
      join: {
        from: "roles.id",
        to: "userRoles.roleId"
      }
    },
    jobVisibilityRoles: {
      relation: Model.HasManyRelation,
      modelClass: JobVisibilityRole,
      join: {
        from: "roles.id",
        to: "jobVisibilityRoles.roleId"
      }
    },
    visibilityFromRoles: {
      relation: Model.HasManyRelation,
      modelClass: RoleVisibilityPermission,
      join: {
        from: "roles.id",
        to: "roleVisibilityPermissions.fromRoleId"
      }
    },
    visibilityToRoles: {
      relation: Model.HasManyRelation,
      modelClass: RoleVisibilityPermission,
      join: {
        from: "roles.id",
        to: "roleVisibilityPermissions.visibleToRoleId"
      }
    },
    commissions: {
      relation: Model.HasManyRelation,
      modelClass: RoleCommission,
      join: {
        from: "roles.id",
        to: "roleCommissions.roleId"
      }
    },
    jobPostingFees: {
      relation: Model.HasManyRelation,
      modelClass: JobPostingFee,
      join: {
        from: "roles.id",
        to: "jobPostingFees.chargedByRoleId"
      }
    }
  });
}
