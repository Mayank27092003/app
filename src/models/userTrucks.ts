import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { TruckType } from "./truckTypes";

export class UserTruck extends Model {
  id!: number;
  userId!: number;
  truckTypeId!: number;
  capacity!: string;
  label?: string | null;
  isPrimary!: boolean;
  capacityUnit!: "ft" | "tons" | "lbs" | "kg" | "m3" | "other";
  createdAt?: string;
  updatedAt?: string;

  static tableName = "userTrucks";

  static jsonSchema = {
    type: "object",
    required: ["userId", "truckTypeId", "capacity"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      truckTypeId: { type: "integer" },
      capacity: { type: "string" },
      capacityUnit: { type: "string", enum: ["ft", "tons", "lbs", "kg", "m3", "other"] },
      label: { type: ["string", "null"] },
      isPrimary: { type: "boolean" },
      createdAt: { type: ["string", "null"] },
      updatedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userTrucks.userId", to: "users.id" },
    },
    truckType: {
      relation: Model.BelongsToOneRelation,
      modelClass: TruckType,
      join: { from: "userTrucks.truckTypeId", to: "truckTypes.id" },
    },
  });
}


