import { Model, RelationMappings } from "objection";
import { User } from "./users";

export class UserLocation extends Model {
  id!: number;
  userId!: number;
  lat!: number;
  lng!: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  provider?: string | null;
  battery?: number | null;
  createdAt?: string;

  static tableName = "userLocations";

  static jsonSchema = {
    type: "object",
    required: ["userId", "lat", "lng"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      lat: { type: "number" },
      lng: { type: "number" },
      accuracy: { type: ["number", "null"] },
      heading: { type: ["number", "null"] },
      speed: { type: ["number", "null"] },
      provider: { type: ["string", "null"] },
      battery: { type: ["number", "null"], minimum: 0, maximum: 100 },
      createdAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "userLocations.userId", to: "users.id" },
    },
  });
}


