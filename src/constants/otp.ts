export const OtpPurpose = {
  EMAIL_VERIFICATION: "email_verification",
  PHONE_VERIFICATION: "phone_verification",
  PASSWORD_RESET: "password_reset",
  PAYMENT_VERIFICATION: "payment_verification",
} as const;

export type OtpPurposeType = (typeof OtpPurpose)[keyof typeof OtpPurpose];
