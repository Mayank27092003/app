import { AuthController } from "../../controllers/auth";
import { useValidator } from "../../middlewares/validate";
import { createSignupSchema } from "../../validators/auth.schema";
import type { RouteDefinition } from "../types";

const controller = new AuthController();

const signupRoute: RouteDefinition = {
  path: "/signup",
  controller: { post: controller.signup },
  validators: { post: useValidator(createSignupSchema) },
  docs: {
    post: {
      summary: "Signup new user",
      description: "Register a new user account. An OTP will be sent to the provided email for verification. Optional callbackUrl can be provided for email verification redirects (supports any URL format including app URLs like 'gofrts://' or 'https://').",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: createSignupSchema,
            example: {
              userName: "johndoe",
              email: "john@example.com",
              password: "SecurePassword123!",
              callbackUrl: "gofrts://verify-email",
            },
          },
        },
      },
      responses: {
        201: { description: "User signed up successfully" },
        409: { description: "Email already in use" },
      },
    },
  },
};

export const verifyEmailRoute: RouteDefinition = {
  path: "/verify-email",
  controller: { get: controller.verifyEmailByToken },
  docs: {
    get: {
      summary: "Verify email via token",
      tags: ["Auth"],
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Email verification token",
        },
      ],
      responses: {
        200: { description: "Email verified successfully" },
        400: { description: "Invalid or expired token" },
      },
    },
  },
};

export default [signupRoute, verifyEmailRoute];
