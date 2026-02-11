import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { JobInviteService } from "../../services/jobInvite";
import { HttpException } from "../../utils/httpException";

export class JobInviteController {
  private service = new JobInviteService();

  /**
   * Invite a user to a job
   */
  inviteUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const { invitedUserId, message } = req.body;
      const invitedByUserId = req.user?.id;

      if (!invitedByUserId) {
        throw new HttpException("Unauthorized", 401);
      }

      if (!invitedUserId) {
        throw new HttpException("invitedUserId is required", 400);
      }

      const invite = await this.service.inviteUserToJob(
        jobId,
        invitedUserId,
        invitedByUserId,
        message
      );

      res.json({
        success: true,
        data: invite,
        message: "User invited to job successfully",
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || "Internal error",
      });
    }
  };

  /**
   * Accept a job invitation
   */
  acceptInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const invite = await this.service.acceptInvite(jobId, userId);

      res.json({
        success: true,
        data: invite,
        message: "Invitation accepted successfully",
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || "Internal error",
      });
    }
  };

  /**
   * Decline a job invitation
   */
  declineInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { reason } = req.body || {};

      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const invite = await this.service.declineInvite(jobId, userId, reason);

      res.json({
        success: true,
        data: invite,
        message: "Invitation declined",
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || "Internal error",
      });
    }
  };

  /**
   * Get my job invitations
   */
  getMyInvites = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const filters: { status?: string } = {};
      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      const invites = await this.service.getMyInvites(userId, filters);

      res.json({
        success: true,
        data: invites,
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || "Internal error",
      });
    }
  };
}

