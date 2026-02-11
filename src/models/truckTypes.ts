import { Model } from "objection";

export class TruckType extends Model {
  id!: number;
  name!: string;
  translationKey!: string;
  sortIndex!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static tableName = "truckTypes";

  static idColumn = "id";

  static jsonSchema = {
    type: "object",
    required: ["name", "translationKey"],

    properties: {
      id: { type: "integer" },
      name: { type: "string", minLength: 1, maxLength: 255 },
      translationKey: { type: "string", minLength: 1, maxLength: 255 },
      sortIndex: { type: "integer", default: 0 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  $beforeInsert() {
    const now = new Date().toISOString();
    this.createdAt = new Date(now);
    this.updatedAt = new Date(now);
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
