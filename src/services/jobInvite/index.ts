import { transaction } from "objection";
import { JobInvite, Job, User, JobApplication } from "../../models";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { JobInviteEmailService } from "../email/jobInvite.service";

export class JobInviteService {
  /**
   * Invite a user to a job
   */
  async inviteUserToJob(
    jobId: number,
    invitedUserId: number,
    invitedByUserId: number,
    message?: string
  ): Promise<JobInvite> {
    return await transaction(JobInvite.knex(), async (trx) => {
      // Check if job exists
      const job = await Job.query(trx).findById(jobId);
      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      // Check if user exists
      const invitedUser = await User.query(trx).findById(invitedUserId);
      if (!invitedUser) {
        throw new HttpException("User not found", 404);
      }

      // Check if user is already invited
      const existingInvite = await JobInvite.query(trx)
        .where({ jobId, invitedUserId })
        .first();

      if (existingInvite) {
        if (existingInvite.status === "invited") {
          throw new HttpException("User already invited to this job", 400);
        }
        if (existingInvite.status === "accepted") {
          throw new HttpException("User has already accepted this invitation", 400);
        }
        // If declined, allow re-inviting
        if (existingInvite.status === "declined") {
          const updated = await JobInvite.query(trx).patchAndFetchById(existingInvite.id, {
            status: "invited",
            message: message || null,
            declineReason: null,
            respondedAt: null,
            updatedAt: new Date().toISOString(),
          });
          
          // Send email in background
          this.sendInviteEmailInBackground(updated.id).catch((error) => {
            Logger.error(`Failed to send job invite email: ${error.message}`);
          });

          return updated;
        }
      }

      // Check if user already applied
      const existingApplication = await JobApplication.query(trx)
        .where({ jobId, applicantUserId: invitedUserId })
        .first();
      
      if (existingApplication) {
        throw new HttpException("User has already applied for this job", 400);
      }

      // Create invite
      const invite = await JobInvite.query(trx).insertAndFetch({
        jobId,
        invitedUserId,
        invitedByUserId,
        status: "invited",
        message: message || null,
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Logger.info(`User ${invitedUserId} invited to job ${jobId} by user ${invitedByUserId}`);

      // Send email in background
      this.sendInviteEmailInBackground(invite.id).catch((error) => {
        Logger.error(`Failed to send job invite email: ${error.message}`);
      });

      return invite;
    });
  }

  /**
   * Accept a job invitation
   */
  async acceptInvite(jobId: number, userId: number): Promise<JobInvite> {
    return await transaction(JobInvite.knex(), async (trx) => {
      const invite = await JobInvite.query(trx)
        .where({ jobId, invitedUserId: userId, status: "invited" })
        .first();

      if (!invite) {
        throw new HttpException("Invitation not found or already responded", 404);
      }

      // Check if user already applied
      const existingApplication = await JobApplication.query(trx)
        .where({ jobId, applicantUserId: userId })
        .first();
      
      if (existingApplication) {
        throw new HttpException("You have already applied for this job", 400);
      }

      const updated = await JobInvite.query(trx).patchAndFetchById(invite.id, {
        status: "accepted",
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Logger.info(`User ${userId} accepted invitation to job ${jobId}`);

      return updated;
    });
  }

  /**
   * Decline a job invitation
   */
  async declineInvite(
    jobId: number,
    userId: number,
    reason?: string
  ): Promise<JobInvite> {
    return await transaction(JobInvite.knex(), async (trx) => {
      const invite = await JobInvite.query(trx)
        .where({ jobId, invitedUserId: userId, status: "invited" })
        .first();

      if (!invite) {
        throw new HttpException("Invitation not found or already responded", 404);
      }

      const updated = await JobInvite.query(trx).patchAndFetchById(invite.id, {
        status: "declined",
        declineReason: reason || null,
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Logger.info(`User ${userId} declined invitation to job ${jobId}`);

      return updated;
    });
  }

  /**
   * Get all job invitations for a user
   */
  async getMyInvites(userId: number, filters?: { status?: string }): Promise<JobInvite[]> {
    const query = JobInvite.query()
      .where("invitedUserId", userId)
      .withGraphFetched("job")
      .withGraphFetched("invitedByUser")
      .orderBy("invitedAt", "desc");

    if (filters?.status) {
      query.where("status", filters.status);
    }

    return await query;
  }

  /**
   * Send invite email in background
   */
  private async sendInviteEmailInBackground(inviteId: number): Promise<void> {
    const invite = await JobInvite.query()
      .findById(inviteId)
      .withGraphFetched("job")
      .withGraphFetched("invitedUser")
      .withGraphFetched("invitedByUser");

    if (!invite || !invite.job || !invite.invitedUser || !invite.invitedByUser) {
      Logger.error(`Failed to fetch invite data for invite ${inviteId}`);
      return;
    }

    await JobInviteEmailService.sendJobInviteEmail({
      inviteId: invite.id,
      jobId: invite.job.id,
      jobTitle: invite.job.title,
      jobDescription: invite.job.description || "",
      payAmount: invite.job.payAmount || 0,
      pickupLocation: invite.job.pickupLocation,
      dropoffLocation: invite.job.dropoffLocation,
      invitedUser: {
        name: invite.invitedUser.firstName || invite.invitedUser.userName || "User",
        email: invite.invitedUser.email,
      },
      invitedByUser: {
        name: invite.invitedByUser.firstName || invite.invitedByUser.userName || "User",
        email: invite.invitedByUser.email,
      },
      message: invite.message || undefined,
    });
  }
}

