// models/User.ts
import { Model, QueryBuilder, RelationMappings } from "objection";
import { Driver } from "./drivers";
import { Company } from "./companies";
import OtpVerification from "./otpVerifications";
import { UserRole } from "./userRole";
import { CompanyUser } from "./companyUser";
import { Document } from "./document";
import { UserTruck } from "./userTrucks";
import { UserLocation } from "./userLocation";

export class User extends Model {
  id!: number;
  firstName!: string;
  middleName?: string | null;
  lastName!: string;
  userName!: string;
  email!: string;
  password!: string;
  phoneNumber?: string | null; // User's phone number
  phoneCountryCode?: string | null; // User's country code (ISO 3166-1 alpha-2)
  isEmailVerified?: boolean;
  emailVerifiedAt?: Date | null | string;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpiresAt?: string | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiresAt?: Date | null | string;
  profileImage?: string | null;
  verificationStatus?: string;
  verificationStatusUpdatedAt?: Date | null | string;
  verifiedByUserId?: number | null;
  verificationNotes?: string | null;
  lastVerificationAttemptAt?: Date | null | string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  get fullName(): string {
    return [this.firstName, this.middleName, this.lastName]
      .filter(Boolean)
      .join(" ");
  }

  // Relations
  driver?: Driver;
  company?: Company;
  roles?: UserRole[];
  companyMemberships?: CompanyUser[];
  otpVerifications?: OtpVerification[];
  verifiedByUser?: User; // Admin who verified this user
  documents?: Document[]; // User's uploaded documents
  trucks?: UserTruck[];
  location?: UserLocation; // User's current location

  static tableName = "users";

  static jsonSchema = {
    type: "object",
    required: ["firstName", "lastName", "userName", "email", "password"],
    properties: {
      id: { type: "integer" },
      firstName: { type: "string" },
      middleName: { type: ["string", "null"] },
      lastName: { type: "string" },
      userName: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string" },
      phoneNumber: { type: ["string", "null"] },
      phoneCountryCode: { type: ["string", "null"] },
      isEmailVerified: { type: "boolean" },
      emailVerifiedAt: { type: ["string", "null"] },
      emailVerificationToken: { type: ["string", "null"] },
      emailVerificationTokenExpiresAt: { type: ["string", "null"] },
      passwordResetToken: { type: ["string", "null"] },
      passwordResetTokenExpiresAt: { type: ["string", "null"] },
      profileImage: { type: ["string", "null"] },
      verificationStatus: { type: "string" },
      verificationStatusUpdatedAt: { type: ["string", "null"] },
      verifiedByUserId: { type: ["integer", "null"] },
      verificationNotes: { type: ["string", "null"] },
      lastVerificationAttemptAt: { type: ["string", "null"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    driver: {
      relation: Model.HasOneRelation,
      modelClass: Driver,
      join: {
        from: "users.id",
        to: "drivers.userId",
      },
    },
    company: {
      relation: Model.HasOneRelation,
      modelClass: Company,
      join: {
        from: "users.id",
        to: "companies.userId",
      },
    },
    roles: {
      relation: Model.HasManyRelation,
      modelClass: UserRole,
      join: {
        from: "users.id",
        to: "userRoles.userId",
      },
    },
    companyMemberships: {
      relation: Model.HasManyRelation,
      modelClass: CompanyUser,
      join: {
        from: "users.id",
        to: "companyUsers.userId",
      },
    },
    otpVerifications: {
      relation: Model.HasManyRelation,
      modelClass: OtpVerification,
      join: {
        from: "users.id",
        to: "otpVerifications.userId",
      },
    },
    verifiedByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "users.verifiedByUserId",
        to: "users.id",
      },
    },
    trucks: {
      relation: Model.HasManyRelation,
      modelClass: UserTruck,
      join: {
        from: "users.id",
        to: "userTrucks.userId",
      },
    },
    location: {
      relation: Model.HasOneRelation,
      modelClass: UserLocation,
      join: {
        from: "users.id",
        to: "userLocations.userId",
      },
    },
    documents: {
      relation: Model.HasManyRelation,
      modelClass:Document,
      join: { from: "users.id", to: "documents.userId" },
    },
  });
}
