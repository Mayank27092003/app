import { JSONSchemaType } from "ajv";

export interface CreateTruckTypeDTO {
  name: string;
  translationKey: string;
  sortIndex?: number;
}

export const createTruckTypeSchema: JSONSchemaType<CreateTruckTypeDTO> = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    translationKey: { type: "string", minLength: 1 },
    sortIndex: { type: "integer", nullable: true },
  },
  required: ["name", "translationKey"],
  additionalProperties: false,
};

export const updateTruckTypeSchema: JSONSchemaType<Partial<CreateTruckTypeDTO>> = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, nullable: true },
    translationKey: { type: "string", minLength: 1, nullable: true },
    sortIndex: { type: "integer", nullable: true },
  },
  required: [], // because it's partial
  additionalProperties: false,
};
