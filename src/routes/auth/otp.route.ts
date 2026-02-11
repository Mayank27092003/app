import { AuthController } from "../../controllers/auth";
import { useValidator } from "../../middlewares/validate";
import { verifyOtpSchema, resendOtpSchema } from "../../validators/auth.schema";
import type { RouteDefinition } from "../types";

const controller = new AuthController();

const otpRoutes: RouteDefinition[] = [
  {
    path: "/verify-otp",
    controller: { post: controller.verifyOtp },
    validators: { post: useValidator(verifyOtpSchema) },
    docs: {
      post: {
        summary: "Verify OTP",
        description: "Verify a one-time password (OTP) for various purposes",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "purpose"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "User's email address",
                    example: "user@example.com"
                  },
                  otp: {
                    type: "string",
                    minLength: 4,
                    maxLength: 8,
                    description: "One-time password code",
                    example: "123456"
                  },
                  purpose: {
                    type: "string",
                    enum: ["email_verification", "phone_verification", "password_reset", "payment_verification"],
                    description: "Purpose of the OTP verification",
                    example: "email_verification"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "OTP verified successfully. For password_reset, returns resetToken.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    resetToken: {
                      type: "string",
                      nullable: true,
                      example: "c1e7c9e4-8a90-4a2e-9b1c-0f6f2b7f8d10"
                    },
                    expiresAt: {
                      type: "string",
                      nullable: true,
                      description: "ISO expiry time for resetToken",
                      example: "2025-06-23T10:45:00.000Z"
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    message: {
                      type: "string",
                      example: "Invalid or expired OTP"
                    }
                  }
                }
              }
            }
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    message: {
                      type: "string",
                      example: "User not found"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    path: "/resend-otp",
    controller: { post: controller.resendOtp },
    validators: { post: useValidator(resendOtpSchema) },
    docs: {
      post: {
        summary: "Resend OTP",
        description: "Resend a one-time password (OTP) for various purposes",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "purpose"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "User's email address",
                    example: "user@example.com"
                  },
                  purpose: {
                    type: "string",
                    enum: ["email_verification", "phone_verification", "password_reset", "payment_verification"],
                    description: "Purpose of the OTP",
                    example: "email_verification"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "OTP resent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    message: {
                      type: "string",
                      example: "OTP resent."
                    }
                  }
                }
              }
            }
          },
          404: {
            description: "User not found or email already verified",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    message: {
                      type: "string",
                      example: "Email is already verified."
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
];

export default otpRoutes;
