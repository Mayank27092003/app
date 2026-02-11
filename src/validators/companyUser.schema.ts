import { JSONSchemaType } from "ajv";

export interface AddUserToCompanyDTO {
  userId: number;
  roleId?: number | null;
  isPrimary?: boolean | null;
}

export interface UpdateUserRoleDTO {
  roleId?: number | null;
}

export const addUserToCompanySchema: JSONSchemaType<AddUserToCompanyDTO> = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: {
      type: "integer",
      description: "ID of the user to add to the company",
    },
    roleId: {
      type: "integer",
      nullable: true,
      description: "ID of the role to assign to the user in the company",
    },
    isPrimary: {
      type: "boolean",
      nullable: true,
      description: "Whether this user is the primary user for the company",
    },
  },
  additionalProperties: false,
};

export const updateUserRoleSchema: JSONSchemaType<UpdateUserRoleDTO> = {
  type: "object",
  required: [],
  properties: {
    roleId: {
      type: "integer",
      nullable: true,
      description: "ID of the role to assign to the user in the company",
    },
  },
  additionalProperties: false,
};

