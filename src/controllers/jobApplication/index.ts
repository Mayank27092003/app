import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { JobApplicationService } from "../../services/jobApplication";
import { BookingConfirmationEmailService } from "../../services/email/bookingConfirmation.service";
import { LoadBookingConfirmationData } from "../../services/pdf/loadBookingConfirmation";
import { User, JobApplication, Contract, Job, UserRole } from "../../models";
import { Logger } from "../../utils/logger";

export class JobApplicationController {
  private service = new JobApplicationService();

  /**
   * Apply for a job
   */
  applyForJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const data = req.body;

      const result = await this.service.applyForJob(userId, data);

      // If auto-assignment occurred (contract was created), send booking confirmation emails
      if (result.contract && result.job) {
        // Send booking confirmation emails in background (fire-and-forget)
        this.sendBookingConfirmationEmailsInBackground({
          application: result.application,
          contract: result.contract,
          job: result.job,
        }).catch((error) => {
          Logger.error(
            `Background email sending failed for auto-assigned application: ${error.message}`
          );
        });
      }

      res.json({
        success: true,
        data: result,
        message: "Application submitted successfully",
      });
    } catch (error: any) {
      console.error("Error applying for job:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to apply for job",
      });
    }
  };

  /**
   * Get job applications (job owner only)
   */
  getJobApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { jobId } = req.params;

      const applications = await this.service.getJobApplications(
        Number(jobId),
        userId,
        req.query
      );

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };

  getApplicationById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const applications = await this.service.getApplicationById(
        Number(applicationId),
        userId
      );

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };
  /**
   * Get user's applications
   */
  getUserApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;

      const applications = await this.service.getUserApplications(userId, {
        ...req.query
      });

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching user applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };

  /**
   * Accept an application (job owner only)
   */
  acceptApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const assignment = await this.service.acceptApplication(
        Number(applicationId),
        userId
      );

      // Send booking confirmation emails in background (fire-and-forget)
      // Don't await - let it run asynchronously so API responds immediately
      this.sendBookingConfirmationEmailsInBackground(assignment).catch((error) => {
        Logger.error(
          `Background email sending failed for application ${applicationId}: ${error.message}`
        );
      });

      res.json({
        success: true,
        data: assignment,
        message: "Application accepted and job assigned",
      });
    } catch (error: any) {
      console.error("Error accepting application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to accept application",
      });
    }
  };

  /**
   * Send booking confirmation emails in background (non-blocking)
   */
  private async sendBookingConfirmationEmailsInBackground(assignment: {
    application: JobApplication;
    contract: Contract;
    job: Job;
  }) {
    const { application, contract, job } = assignment;

    // Fetch both users with their roles
    const postedByUser = await User.query()
      .findById(job.userId)
      .withGraphFetched("[roles.role]");

    const acceptedByUser = await User.query()
      .findById(application.applicantUserId)
      .withGraphFetched("[roles.role]");

    if (!postedByUser || !acceptedByUser) {
      throw new Error("Could not find users for booking confirmation");
    }

    // Get primary role names
    const postedByRole =
      postedByUser.roles?.[0]?.role?.name || "User";
    const acceptedByRole =
      acceptedByUser.roles?.[0]?.role?.name || "User";

    // Format phone numbers
    const formatPhone = (phone?: string | null, countryCode?: string | null) => {
      if (!phone) return undefined;
      if (countryCode) {
        return `${countryCode} ${phone}`;
      }
      return phone;
    };

    // Prepare PDF data
    const pdfData: LoadBookingConfirmationData = {
      bookingId: `BK-${contract.id}`,
      loadId: `LD-${job.id}`,
      pickup: {
        address: job.pickupLocation?.address || "",
        city: job.pickupLocation?.city || "",
        state: job.pickupLocation?.state || "",
        country: job.pickupLocation?.country || "",
        zipCode: job.pickupLocation?.zipCode || "",
        date: job.pickupLocation?.date || "",
        time: job.pickupLocation?.time || "",
      },
      delivery: {
        address: job.dropoffLocation?.address || "",
        city: job.dropoffLocation?.city || "",
        state: job.dropoffLocation?.state || "",
        country: job.dropoffLocation?.country || "",
        zipCode: job.dropoffLocation?.zipCode || "",
        date: job.dropoffLocation?.date || "",
        time: job.dropoffLocation?.time || "",
      },
      commodity: {
        type: job.cargo?.cargoType || "General Freight",
        weight: job.cargo?.cargoWeight || 0,
        weightUnit: job.cargo?.cargoWeightUnit || "lbs",
        pieces: undefined,
        distance: job.cargo?.distance,
        estimatedDuration: job.cargo?.estimatedDuration,
      },
      payment: {
        amount: contract.amount,
        currency: "USD",
      },
      postedBy: {
        name: postedByUser.fullName,
        role: postedByRole,
        email: postedByUser.email,
        phone: formatPhone(
          postedByUser.phoneNumber,
          postedByUser.phoneCountryCode
        ),
      },
      acceptedBy: {
        name: acceptedByUser.fullName,
        role: acceptedByRole,
        email: acceptedByUser.email,
        phone: formatPhone(
          acceptedByUser.phoneNumber,
          acceptedByUser.phoneCountryCode
        ),
      },
      bookingDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      specialRequirements: job.specialRequirements || undefined,
    };

    // Send emails to both parties
    await BookingConfirmationEmailService.sendBookingConfirmationEmails(pdfData);
  }

  /**
   * Reject an application (job owner only)
   */
  rejectApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;
      const { reason } = req.body;

      const application = await this.service.rejectApplication(
        Number(applicationId),
        userId,
        reason
      );

      res.json({
        success: true,
        data: application,
        message: "Application rejected",
      });
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to reject application",
      });
    }
  };

  /**
   * Withdraw application (applicant only)
   */
  withdrawApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const application = await this.service.withdrawApplication(
        Number(applicationId),
        userId
      );

      res.json({
        success: true,
        data: application,
        message: "Application withdrawn",
      });
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to withdraw application",
      });
    }
  };
}
