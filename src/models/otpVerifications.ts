import { Model } from "objection";
import { User } from "./users";
import { OtpPurposeType } from "../constants/otp";

export default class OtpVerification extends Model {
  id!: number;
  userId!: number;
  type!: "email" | "phone";
  purpose!: OtpPurposeType;
  otpCode!: string;
  isUsed!: boolean;
  expiresAt!: Date | string;
  createdAt!: Date;

  static tableName = "otpVerifications";

  static get jsonSchema() {
    return {
      type: "object",
      required: ["userId", "otpCode", "expiresAt", "purpose"],
      properties: {
        id: { type: "integer" },
        userId: { type: "integer" },
        type: { type: "string", enum: ["email", "phone"] },
        purpose: {
          type: "string",
          enum: [
            "email_verification",
            "phone_verification",
            "login_2fa",
            "payment_authorization",
            "password_reset",
          ],
        },
        otpCode: { type: "string" },
        isUsed: { type: "boolean" },
        expiresAt: { type: "string", format: "date-time" },
        createdAt: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "otpVerifications.userId",
          to: "users.id",
        },
      },
    };
  }
}