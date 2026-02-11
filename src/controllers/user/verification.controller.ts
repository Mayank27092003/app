import { Request, Response, NextFunction } from "express";
import { UserVerificationService } from "../../services/user/verification.service";
import { UserVerificationStatus } from "../../constants/enum";
import { AuthenticatedRequest } from "../../types";
import { requireRole } from "../../middlewares/requireRole";
import { HttpException } from "../../utils/httpException";

const verificationService = new UserVerificationService();

export class UserVerificationController {
  /**
   * Get user's own verification status
   */
  async getMyVerificationStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const summary = await verificationService.getVerificationSummary(userId!);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update user verification status (Admin only)
   */
  async updateUserVerificationStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } : any= req.params;
      const { status, notes } = req.body;
      const adminUserId = req.user?.id;

      // Validate status
      const validStatuses = Object.values(UserVerificationStatus);
      if (!validStatuses.includes(status)) {
        throw new HttpException(`Invalid status. Must be one of: ${validStatuses.join(", ")}` , 400);
      }

      const result = await verificationService.updateVerificationStatus(
        parseInt(userId!),
        status,
        adminUserId,
        notes
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get pending verifications (Admin only)
   */
  async getPendingVerifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { limit = 50, offset = 0 } : any = req.query;
      
      const users = await verificationService.getPendingVerifications(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check verification requirements for specific action
   */
  async checkVerificationRequirements(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const { requiredStatus } = req.body;

      const result = await verificationService.checkVerificationRequirements(
        userId!,
        requiredStatus
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Auto-update verification status based on user actions
   */
  async autoUpdateVerificationStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      const result = await verificationService.autoUpdateVerificationStatus(userId!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
