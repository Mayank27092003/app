import { FromSchema } from "json-schema-to-ts";

// Signup Schema
export const createSignupSchema = {
  type: "object",
  required: ["userName", "email", "password"],
  additionalProperties: false,
  properties: {
    userName: { type: "string", minLength: 2 },
    email: { type: "string", format: "email" },
    password: {
      type: "string",
      minLength: 6,
      pattern:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^])[A-Za-z\\d@$!%*?&#^]{6,}$",
    },
    phoneCountryCode: {
      type: "string",
      pattern: "^\\+?[0-9]{1,4}$", // +1, +91, +358 etc.
      minLength: 1,
      maxLength: 5,
    },
    phoneNumber: {
      type: "string",
      pattern: "^[0-9]{6,15}$", // only digits, length check
    },
    callbackUrl: { type: "string", minLength: 1 },
    companyTypeId: { type: ["integer", "null"] },
    companyName: { type: ["string", "null"] },
    profileImage: { type: ["string", "null"], format: "uri" },
  },
  errorMessage: {
    required: {
      password: "Password is required",
    },
    properties: {
      password:
        "must be at least 6 characters, include upper and lower case letters, a number, and a special character",
    },
  },
} as const;

// Login Schema
export const createLoginSchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" },
    callbackUrl: { type: "string", minLength: 1 },
  },
} as const;

// Verify OTP Schema
export const verifyOtpSchema = {
  type: "object",
  required: ["email", "otp", "purpose"],
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    otp: {
      type: "string",
      minLength: 4,
      maxLength: 8,
    },
    purpose: {
      type: "string",
      enum: [
        "email_verification",
        "phone_verification",
        "password_reset",
        "payment_verification",
      ],
    },
  },
  additionalProperties: false,
} as const;

// Resend OTP Schema
export const resendOtpSchema = {
  type: "object",
  required: ["email", "purpose"],
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    purpose: {
      type: "string",
      enum: [
        "email_verification",
        "phone_verification",
        "password_reset",
        "payment_verification",
      ],
    },
  },
  additionalProperties: false,
} as const;

// Forgot Password Schema
export const forgotPasswordSchema = {
  type: "object",
  required: ["email", "callbackUrl"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    callbackUrl: { type: "string", minLength: 1 },
  },
} as const;

// Reset Password Schema
export const resetPasswordSchema = {
  type: "object",
  required: ["token", "newPassword"],
  additionalProperties: false,
  properties: {
    token: { type: "string", minLength: 1 },
    newPassword: { type: "string", minLength: 6 },
  },
} as const;

// Change Password Schema
export const changePasswordSchema = {
  type: "object",
  required: ["oldPassword", "newPassword"],
  additionalProperties: false,
  properties: {
    oldPassword: { type: "string", minLength: 6 },
    newPassword: { type: "string", minLength: 6 },
  },
} as const;

// Delete Account Schema
export const deleteAccountSchema = {
  type: "object",
  required: ["password"],
  additionalProperties: false,
  properties: {
    password: { type: "string", minLength: 1 },
  },
} as const;

// ========== Types ==========
export type SignupInput = FromSchema<typeof createSignupSchema>;
export type LoginInput = FromSchema<typeof createLoginSchema>;
export type VerifyOtpInput = FromSchema<typeof verifyOtpSchema>;
export type OtpResendInput = FromSchema<typeof resendOtpSchema>;
export type ForgotPasswordInput = FromSchema<typeof forgotPasswordSchema>;
export type ResetPasswordInput = FromSchema<typeof resetPasswordSchema>;
export type ChangePasswordInput = FromSchema<typeof changePasswordSchema>;
export type DeleteAccountInput = FromSchema<typeof deleteAccountSchema>;
