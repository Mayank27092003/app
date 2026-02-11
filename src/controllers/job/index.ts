import { Request, Response } from "express";
import { JobService } from "../../services/job";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { AuthenticatedRequest } from "../../types";

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * Create a new job
   * POST /jobs
   */
  createJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        description,
        payAmount,
        jobType,
        assignmentType,
        startDate,
        endDate,
        tonuAmount,
        isTonuEligible,
        pickupLocation,
        dropoffLocation,
        visibleToRoles,
        cargo,
        specialRequirements,
      } = req.body;
      const protocol = req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}`;

      const companyId = (req as any).user?.company?.id;
      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }

      if (
        !title ||
        !payAmount ||
        !jobType ||
        !assignmentType ||
        !visibleToRoles
      ) {
        throw new HttpException("Missing required fields", 400);
      }

      const result = await this.jobService.createJob({
        userId: req.user?.id!,
        companyId,
        title,
        description,
        payAmount,
        jobType,
        assignmentType,
        startDate,
        endDate,
        tonuAmount,
        isTonuEligible,
        pickupLocation,
        dropoffLocation,
        visibleToRoles,
        cargo,
        specialRequirements,
      },baseUrl);

      res.status(201).json({
        success: true,
        message: "Job created successfully. Please complete payment to activate the job.",
        data: {
          job: result.job,
          paymentUrl: result.paymentUrl, // Stripe Checkout URL - redirect user to this URL
          sessionId: result.sessionId,
          paymentIntentId: result.paymentIntentId,
        },
      });
    } catch (error: any) {
      Logger.error(
        `Error in createJob controller: ${error?.message || "Unknown error"}`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get jobs visible to the authenticated user
   * GET /jobs
   */
  getVisibleJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = {
        ...req.query,
        status:req.query.status as string | string[],
        jobType: req.query.jobType as string,
        minPay: req.query.minPay
          ? parseFloat(req.query.minPay as string)
          : undefined,
        maxPay: req.query.maxPay
          ? parseFloat(req.query.maxPay as string)
          : undefined,
        isMine:req.query.isMine === 'true',
        roleId: req.query.roleId
          ? parseInt(req.query.roleId as string)
          : undefined,
        search: req.query.search as string | undefined,
      };

      const jobs = await this.jobService.getVisibleJobs(
        req?.user as any,
        filters
      );

      res.json({
        success: true,
        ...jobs,
      });
    } catch (error: any) {
      Logger.error(
        `Error in getVisibleJobs controller: ${
          error?.message || "Unknown error"
        }`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get job details
   * GET /jobs/:id
   */
  getJobDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!jobId || isNaN(jobId)) {
        throw new HttpException("Valid job ID is required", 400);
      }

      const jobDetails = await this.jobService.getJobDetails(jobId, req?.user);

      res.json({
        success: true,
        data: jobDetails,
      });
    } catch (error: any) {
      Logger.error(
        `Error in getJobDetails controller: ${
          error?.message || "Unknown error"
        }`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Assign a job to a driver
   * POST /jobs/:id/assign
   */
  assignJob = async (req: Request, res: Response) => {
    res.status(400).json({ success: false, message: "Deprecated: use applications -> contract flow" });
  };

  /**
   * Auto-assign a job (for short jobs)
   * POST /jobs/:id/auto-assign
   */
  autoAssignJob = async (req: Request, res: Response) => {
    res.status(400).json({ success: false, message: "Deprecated: use applications -> contract flow" });
  };

  /**
   * Create a job contract
   * POST /jobs/:id/contracts
   */
  createContract = async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const { driverId, contractAmount, startDate, endDate, terms } = req.body;
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }
      if (!jobId || isNaN(jobId)) {
        throw new HttpException("Valid job ID is required", 400);
      }
      if (!driverId || !contractAmount) {
        throw new HttpException("Driver ID and contract amount are required", 400);
      }

      const contract = await this.jobService.createContract(jobId, {
        driverId,
        contractAmount,
        startDate,
        endDate,
        terms,
      });

      res.status(201).json({ success: true, message: "Contract created (pending)", data: contract });
    } catch (error: any) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Start a contract and hold escrow
   * POST /contracts/:id/start
   */
  startContract = async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(String(req.params.id));
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }

      if (!contractId || isNaN(contractId)) {
        throw new HttpException("Valid contract ID is required", 400);
      }

      const contract = await this.jobService.startContract(contractId);

      res.json({
        success: true,
        message: "Contract started and escrow held successfully",
        data: contract,
      });
    } catch (error: any) {
      Logger.error(
        `Error in startContract controller:: ${
          error?.message || "Unknown error"
        }`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Complete a job and release escrow
   * POST /contracts/:id/complete
   */
  completeJob = async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(String(req.params.id));
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }

      if (!contractId || isNaN(contractId)) {
        throw new HttpException("Valid contract ID is required", 400);
      }

      const contract = await this.jobService.completeJob(contractId);

      res.json({
        success: true,
        message: "Job completed and escrow released successfully",
        data: contract,
      });
    } catch (error: any) {
      Logger.error(
        `Error in completeJob controller:: ${error?.message || "Unknown error"}`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Update job status
   * PATCH /jobs/:id/status
   */
  updateJobStatus = async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const { status } = req.body;
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }

      if (!jobId || isNaN(jobId)) {
        throw new HttpException("Valid job ID is required", 400);
      }

      if (!status) {
        throw new HttpException("Status is required", 400);
      }

      // Validate status transition logic here
      const validStatuses = [
        "draft",
        "active",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        throw new HttpException("Invalid status", 400);
      }

      // Update job status
      // This would be implemented in the service layer

      res.json({
        success: true,
        message: "Job status updated successfully",
      });
    } catch (error: any) {
      Logger.error(
        `Error in updateJobStatus controller:: ${
          error?.message || "Unknown error"
        }`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Update job (no assignments and no applications)
   * PATCH /jobs/:id
   */
  updateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const companyId = (req as any).user?.company?.id || (req as any).user?.companyId;
      if (!companyId) throw new HttpException("Company ID is required", 400);
      const updated = await this.jobService.updateJob(jobId, companyId, req.body || {});
      res.json({ success: true, data: updated });
    } catch (error: any) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Delete job (only when no applications and unassigned)
   * DELETE /jobs/:id
   */
  deleteJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const companyId = (req as any).user?.company?.id || (req as any).user?.companyId;
      if (!companyId) throw new HttpException("Company ID is required", 400);
      const result = await this.jobService.deleteJob(jobId, companyId);
      res.json({ ...result });
    } catch (error: any) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Get job assignments for a company
   * GET /jobs/assignments
   */
  getJobAssignments = async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).user?.companyId;
      if (!companyId) {
        throw new HttpException("Company ID is required", 400);
      }

      // This would be implemented in the service layer
      // For now, return a placeholder response
      res.json({
        success: true,
        message: "Job assignments endpoint - to be implemented",
        data: [],
      });
    } catch (error: any) {
      Logger.error(
        `Error in getJobAssignments controller:: ${
          error?.message || "Unknown error"
        }`
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  /**
   * Reshare a job
   * POST /jobs/:id/reshare
   */
  reshareJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobId = parseInt(String(req.params.id));
      const { payAmount, visibleToRoles } = req.body;
      const userId = req.user?.id!;
      const userRole = req.user?.role;

      if (!jobId || isNaN(jobId)) {
        throw new HttpException("Valid job ID is required", 400);
      }

      if (!payAmount || typeof payAmount !== "number" || payAmount <= 0) {
        throw new HttpException("Valid pay amount is required", 400);
      }

      if (!req.user?.company?.id) {
        throw new HttpException("User must be associated with a company to reshare jobs", 400);
      }

      const resharedJob = await this.jobService.reshareJob(jobId, payAmount, userId, userRole, req.user?.company?.id, visibleToRoles);

      res.status(201).json({
        success: true,
        message: "Job reshared successfully",
        data: resharedJob,
      });
    } catch (error: any) {
      Logger.error(`Error in reshareJob controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };
  /**
   * Get or create payment session for an existing job (retry payment)
   * POST /jobs/:jobId/payment/retry
   */
  retryPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const protocol = req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}`;

      const jobIdNum = parseInt(String(req.params.jobId), 10);
      if (isNaN(jobIdNum)) {
        throw new HttpException("Invalid job ID", 400);
      }

      // Verify job belongs to user's company
      const job = await this.jobService.getJobDetails(jobIdNum);
      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      const userCompanyId = (req as any).user?.company?.id;
      if (job.companyId !== userCompanyId && !(req as any).user?.isAdmin) {
        throw new HttpException("Unauthorized to access this job", 403);
      }

      const result = await this.jobService.getOrCreatePaymentSession(
        jobIdNum,
        baseUrl
      );

      res.json({
        success: true,
        message: result.isReused
          ? "Existing payment session found and reused"
          : "New payment session created",
        data: {
          paymentUrl: result.paymentUrl,
          sessionId: result.sessionId,
          paymentIntentId: result.paymentIntentId,
          isReused: result.isReused,
        },
      });
    } catch (error: any) {
      Logger.error(
        `Error in retryPayment controller: ${error?.message || "Unknown error"}`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get job statistics
   * GET /jobs/stats
   */
  getJobStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await this.jobService.getJobStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      Logger.error(
        `Error in getJobStats controller: ${error?.message || "Unknown error"}`
      );
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };
}
