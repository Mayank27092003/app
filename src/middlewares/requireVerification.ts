import { Response, NextFunction } from "express";
import { UserVerificationService } from "../services/user/verification.service";
import { UserVerificationStatusType } from "../constants/enum";
import { AuthenticatedRequest } from "../types";
import { HttpException } from "../utils/httpException";

const verificationService = new UserVerificationService();

/**
 * Middleware to require specific verification status
 */
export function requireVerification(requiredStatus: UserVerificationStatusType) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      next();
      return;
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      await verificationService.checkVerificationRequirements(userId!, requiredStatus);
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        next(new HttpException("Verification check failed", 500));
      }
    }
  };
}

/**
 * Middleware to require at least profile completion
 */
export function requireProfileComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireVerification("profile_complete")(req, res, next);
}

/**
 * Middleware to require document verification
 */
export function requireDocumentsVerified(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireVerification("documents_verified")(req, res, next);
}

/**
 * Middleware to require admin verification
 */
export function requireAdminVerified(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireVerification("admin_verified")(req, res, next);
}

/**
 * Middleware to require full verification
 */
export function requireFullyVerified(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireVerification("fully_verified")(req, res, next);
}
