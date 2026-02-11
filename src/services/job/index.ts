import {
  Job,
  JobContract,
  JobAssignment,
  Escrow,
  User,
  Company,
  Driver,
  JobVisibilityRole,
  Conversation,
  JobApplication,
  Contract,
  SubContract,
  ConversationParticipant,
  PaymentProvider,
  StripePayment,
} from "../../models";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { generateContractNumber } from "../../utils/contract";
import {
  emitContractCreated,
  emitContractStarted,
  emitJobCompleted,
  emitJobCreated,
} from "../socket/instance";
import { raw } from "objection";
import { StripeService } from "../stripe/stripe.service";
import db from "../../database/db";

export interface CreateJobData {
  userId: number;
  companyId: number;
  title: string;
  description?: string;
  payAmount: number;
  jobType: "short" | "long";
  assignmentType?: "auto" | "manual";
  startDate?: string;
  endDate?: string;
  tonuAmount?: number;
  isTonuEligible?: boolean;
  pickupLocation?: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    lat: number;
    lng: number;
    date: string; // e.g. "2025-09-02"
    time: string; // e.g. "14:30"
  };
  dropoffLocation?: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    lat: number;
    lng: number;
    date: string; // e.g. "2025-09-02"
    time: string; // e.g. "14:30"
  };
  visibleToRoles: number[]; // Role IDs that can see this job
  cargo?: {
    distance: number; // in km/miles
    estimatedDuration: string; // e.g. "2h 30m"
    cargoType: string; // e.g. "electronics"
    cargoWeight: number; // numeric value
    cargoWeightUnit: "kg" | "lbs" | "tons"; // unit
    requiredTruckTypeIds: number[]; // references truckTypes.id
  };
  specialRequirements?: string;
}

export interface AssignJobData {
  jobId: number;
  driverId: number;
  assignedByCompanyId: number;
  assignmentType: "auto" | "manual" | "direct";
  notes?: string;
}

export interface CreateContractData {
  jobId: number;
  driverId: number;
  companyId: number;
  contractAmount: number;
  startDate?: string;
  endDate?: string;
  terms?: string;
  milestones?: any[];
  paymentSchedule?: any[];
}

export class JobService {
  /**
   * Get root owners for multiple reshared jobs efficiently
   */
  private async getRootOwnersForJobs(jobIds: number[]): Promise<any[]> {
    if (jobIds.length === 0) return [];

    try {
      // Use a recursive CTE to find root jobs for all reshared jobs at once
      const rootOwners = await Job.query()
        .withRecursive("job_hierarchy", (qb) => {
          qb.select("id", "parentJobId", "userId", "companyId")
            .from("jobs")
            .whereIn("id", jobIds)
            .unionAll(
              qb
                .select("j.id", "j.parentJobId", "j.userId", "j.companyId")
                .from("jobs as j")
                .join("job_hierarchy as jh", "j.id", "jh.parentJobId")
                .whereNotNull("j.parentJobId")
            );
        })
        .select([
          "jh.id as jobId",
          "root_job.userId",
          "root_job.companyId",
          "root_user.id as user_id",
          "root_user.firstName as user_firstName",
          "root_user.lastName as user_lastName",
          "root_user.email as user_email",
          "root_company.id as company_id",
          "root_company.name as company_name",
        ])
        .from("job_hierarchy as jh")
        .join("job_hierarchy as root_job", (join) => {
          join
            .on("root_job.id", "=", "jh.id")
            .andOnNull("root_job.parentJobId");
        })
        .leftJoin("users as root_user", "root_job.userId", "root_user.id")
        .leftJoin(
          "companies as root_company",
          "root_job.companyId",
          "root_company.id"
        )
        .whereIn("jh.id", jobIds);

      return rootOwners.map((row: any) => ({
        jobId: row.jobId,
        userId: row.userId,
        companyId: row.companyId,
        user: row.user_id
          ? {
              id: row.user_id,
              firstName: row.user_firstName,
              lastName: row.user_lastName,
              email: row.user_email,
            }
          : null,
        company: row.company_id
          ? {
              id: row.company_id,
              name: row.company_name,
            }
          : null,
      }));
    } catch (error) {
      // Fallback to simpler approach if recursive CTE fails
      Logger.warn(
        "Recursive CTE failed, using fallback method for root owners"
      );
      return this.getRootOwnersFallback(jobIds);
    }
  }

  /**
   * Fallback method to get root owners (simpler but less efficient)
   */
  private async getRootOwnersFallback(jobIds: number[]): Promise<any[]> {
    const results = [];

    for (const jobId of jobIds) {
      try {
        const rootJob = await this.findRootJob(jobId);
        if (rootJob) {
          results.push({
            jobId,
            userId: rootJob.userId,
            companyId: rootJob.companyId,
            user: rootJob.user,
            company: rootJob.company,
          });
        }
      } catch (error) {
        Logger.error(`Error finding root job for ${jobId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Find root job for a given job ID (reusable function)
   */
  private async findRootJob(jobId: number): Promise<any> {
    let currentJob = await Job.query()
      .findById(jobId)
      .withGraphFetched("[user, company]");

    if (!currentJob) return null;

    while (currentJob.parentJobId) {
      const parentJob = await Job.query()
        .findById(currentJob.parentJobId)
        .withGraphFetched("[user, company]");

      if (parentJob) {
        currentJob = parentJob;
      } else {
        break;
      }
    }

    return currentJob;
  }

  /**
   * Get or create payment session for an existing job
   * Checks for existing pending sessions and reuses them if valid
   */
  async getOrCreatePaymentSession(
    jobId: number,
    baseUrl?: string
  ): Promise<{
    paymentUrl: string;
    sessionId: string;
    paymentIntentId: string;
    isReused: boolean;
  }> {
    try {
      // Find existing pending payment for this job
      const existingPayment = await StripePayment.query()
        .where({ jobId, status: "pending" })
        .whereNotNull("stripeCheckoutSessionId")
        .orderBy("createdAt", "desc")
        .first();

      // If existing session found, check if it's still valid
      if (existingPayment?.stripeCheckoutSessionId) {
        const stripeSession = await StripeService.getCheckoutSession(
          existingPayment.stripeCheckoutSessionId
        );

        if (stripeSession) {
          // Session is still valid, reuse it
          const paymentIntentId =
            typeof stripeSession.payment_intent === "string"
              ? stripeSession.payment_intent
              : stripeSession.payment_intent?.id || "";

          Logger.info(
            `Reusing existing payment session ${existingPayment.stripeCheckoutSessionId} for job ${jobId}`
          );

          return {
            paymentUrl: stripeSession.url || "",
            sessionId: stripeSession.id,
            paymentIntentId,
            isReused: true,
          };
        } else {
          // Session expired or completed, mark payment as failed and create new one
          Logger.info(
            `Existing session ${existingPayment.stripeCheckoutSessionId} is no longer valid, creating new session`
          );
          await StripePayment.query()
            .patch({ status: "failed", updatedAt: new Date().toISOString() })
            .where({ id: existingPayment.id });
        }
      }

      // No valid session found, get job details and create new session
      const job = await Job.query().findById(jobId);
      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      // Check if job already has payment completed
      const completedPayment = await StripePayment.query()
        .where({ jobId, status: "succeeded" })
        .first();

      if (completedPayment) {
        throw new HttpException("Payment already completed for this job", 400);
      }

      // Create new checkout session
      const checkoutSession = await StripeService.createJobCheckoutSession(
        job.userId,
        job.id,
        job.payAmount,
        job.title,
        "usd",
        undefined,
        undefined,
        {
          baseUrl: baseUrl || "",
        }
      );

      // Store or update payment record
      if (existingPayment) {
        // Update existing payment record with new session
        await StripePayment.query()
          .patch({
            stripePaymentIntentId: checkoutSession.paymentIntentId || null,
            stripeCheckoutSessionId: checkoutSession.session.id,
            status: "pending",
            updatedAt: new Date().toISOString(),
          })
          .where({ id: existingPayment.id });
      } else {
        // Create new payment record
        await StripePayment.query().insert({
          jobId: job.id,
          companyId: job.companyId,
          baseAmount: job.payAmount,
          companyCommission: 0,
          driverCommission: 0,
          totalAmount: job.payAmount,
          stripePaymentIntentId: checkoutSession.paymentIntentId || null,
          stripeCheckoutSessionId: checkoutSession.session.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      Logger.info(
        `Created new payment session ${checkoutSession.session.id} for job ${jobId}`
      );

      return {
        paymentUrl: checkoutSession.paymentUrl,
        sessionId: checkoutSession.session.id,
        paymentIntentId: checkoutSession.paymentIntentId,
        isReused: false,
      };
    } catch (error: any) {
      Logger.error(
        `Error getting or creating payment session: ${
          error?.message || "Unknown error"
        }`
      );
      throw error;
    }
  }

  /**
   * Create a new job with visibility control
   */
  async createJob(
    data: CreateJobData,
    baseUrl?: string
  ): Promise<{
    job: Job;
    paymentUrl: string;
    sessionId: string;
    paymentIntentId: string;
  }> {
    const trx = await db.transaction();
    try {
      // Validate company exists
      const company = await Company.query(trx).findById(data.companyId);
      if (!company) {
        throw new HttpException("Company not found", 400);
      }

      // Validate payAmount
      if (!data.payAmount || data.payAmount <= 0) {
        throw new HttpException("Pay amount must be greater than 0", 400);
      }

      // Decide assignmentType based on jobType if not explicitly provided
      const computedAssignmentType: "auto" | "manual" = data.assignmentType
        ? data.assignmentType
        : data.jobType === "short"
        ? "auto"
        : "manual";

      const job = await Job.query().insert({
        userId: data.userId,
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        payAmount: data.payAmount,
        jobType: data.jobType,
        assignmentType: computedAssignmentType,
        startDate: data.startDate,
        endDate: data.endDate,
        tonuAmount: data.tonuAmount,
        isTonuEligible: data.isTonuEligible,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        status: "pending_funding",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cargo: data.cargo,
        specialRequirements: data.specialRequirements,
      });

      // Create escrow for job (pre-contract)
      await Escrow.query(trx).insert({
        jobId: job.id,
        amount: data.payAmount,
        status: "pending",
      });

      // Create Stripe Checkout Session for job funding (returns payment URL)
      const checkoutSession = await StripeService.createJobCheckoutSession(
        data.userId,
        job.id,
        data.payAmount,
        data.title,
        "usd",
        undefined,
        undefined,
        {
          baseUrl: baseUrl || "",
        }
      );

      // Store payment session in StripePayment table (for tracking)
      // Always save session ID even if paymentIntentId is not available yet
      // Payment intent may be created later when the session is completed
      await StripePayment.query(trx).insert({
        jobId: job.id,
        companyId: data.companyId,
        baseAmount: data.payAmount,
        companyCommission: 0, // Will be calculated later
        driverCommission: 0, // Will be calculated later
        totalAmount: data.payAmount,
        stripePaymentIntentId: checkoutSession.paymentIntentId || null,
        stripeCheckoutSessionId: checkoutSession.session.id,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Set job visibility for specified roles
      if (data.visibleToRoles.length > 0) {
        const visibilityRecords = data.visibleToRoles.map((roleId, index) => ({
          jobId: job.id,
          roleId,
          sortOrder: index,
        }));

        await JobVisibilityRole.query(trx).insert(visibilityRecords);
      }

      await trx.commit();

      Logger.info(`Job created successfully with pending funding: ${job.id}`);

      return {
        job,
        paymentUrl: checkoutSession.paymentUrl, // This is the Stripe Checkout URL
        sessionId: checkoutSession.session.id,
        paymentIntentId: checkoutSession.paymentIntentId,
      };
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error creating job: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  async getVisibleJobs(
    user: any,
    filters?: {
      status?: string | string[];
      jobType?: string;
      minPay?: number;
      maxPay?: number;
      location?: string;
      showNearby?: number;
      lat?: number;
      lng?: number;
      isMine?: boolean;
      page?: number;
      limit?: number;
      truckTypeIds?: string;
      roleId?: number;
      search?: string;
    }
  ): Promise<{
    jobs: (Job & { distance: number; pricePerMile: number })[];
    pagination: {
      total: number; // ✅ total count based on filters
      totalPages: number; // ✅ total pages
      page: number; // ✅ current page
      limit: number; // ✅ jobs per page
      count: number; // ✅ jobs in this page
    };
  }> {
    try {
      const userRoleIds = user?.roles?.map((r: any) => r.id) || [];
      const userLat = filters?.lat ?? user?.location?.lat;
      const userLng = filters?.lng ?? user?.location?.lng;

      // ✅ Distance: user → pickup
      const userPickupDistanceSql = `
        3959 * acos(
          cos(radians(?)) * cos(radians(("pickupLocation"->>'lat')::float)) *
          cos(radians(("pickupLocation"->>'lng')::float) - radians(?)) +
          sin(radians(?)) * sin(radians(("pickupLocation"->>'lat')::float))
        )
      `;

      // ✅ Distance: pickup → dropoff
      const pickupDropoffDistanceSql = `
        3959 * acos(
          cos(radians(("pickupLocation"->>'lat')::float)) 
          * cos(radians(("dropoffLocation"->>'lat')::float))
          * cos(radians(("dropoffLocation"->>'lng')::float) - radians(("pickupLocation"->>'lng')::float))
          + sin(radians(("pickupLocation"->>'lat')::float)) 
          * sin(radians(("dropoffLocation"->>'lat')::float))
        )
      `;

      const useUserLocation = !!(userLat && userLng);

      const distanceExpr = useUserLocation
        ? raw(userPickupDistanceSql, [userLat, userLng, userLat])
        : raw(pickupDropoffDistanceSql);

      const pricePerMileExpr = useUserLocation
        ? raw(
            `(CASE WHEN (${userPickupDistanceSql}) > 0
              THEN (jobs."payAmount" / (${userPickupDistanceSql}))
              ELSE 0 END)`,
            [userLat, userLng, userLat, userLat, userLng, userLat]
          )
        : raw(
            `(CASE WHEN (${pickupDropoffDistanceSql}) > 0
              THEN (jobs."payAmount" / (${pickupDropoffDistanceSql}))
              ELSE 0 END)`
          );

      let query = Job.query()
        .withGraphFetched("[company, visibilityRoles.role]")
        .select(
          "jobs.*",
          distanceExpr.as("distance"),
          pricePerMileExpr.as("pricePerMile")
        )
        .orderBy("createdAt", "desc");

      // ✅ Role-based visibility
      // For admin users, if roleId filter is provided, filter by that role
      // Otherwise, show all jobs (skip role-based filtering)
      if (user.isAdmin) {
        if (filters?.roleId) {
          // Admin filtering by specific role - show only jobs visible to that role
          query = query.whereExists(
            Job.relatedQuery("visibilityRoles").where("roleId", filters.roleId)
          );
        }
        // If admin and no roleId filter, show all jobs (no role-based filtering)
      } else if (!filters?.isMine) {
        // Non-admin users: filter by their roles if they have roles
        // If user has no roles, they should still see jobs (valid users should see jobs)
        // So we show jobs that either have no visibility restrictions OR are visible to their roles
        if (userRoleIds.length > 0) {
          // User has roles: show jobs visible to their roles
          query = query.whereExists(
            Job.relatedQuery("visibilityRoles").whereIn("roleId", userRoleIds)
          );
        }
        // If user has no roles (userRoleIds.length === 0), don't apply role filtering
        // This allows valid users without roles to still see jobs
      }

      // ✅ Nearby filter
      if (filters?.showNearby && useUserLocation) {
        query = query.having(raw("distance <= ?", [filters.showNearby]));
      }

      // ✅ Filters
      if (filters?.status) {
        // Handle both string and array for status - always use whereIn
        const statusArray = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        query = query.whereIn("status", statusArray);
      }
      if (filters?.jobType) query = query.where("jobType", filters.jobType);
      if (filters?.isMine) query = query.where("userId", user?.id);

      // ✅ Payment status filtering
      // For public listings (not viewing own jobs), hide all pending_funding jobs except those less than 24 hours old
      // Admin users can see all jobs including pending_funding regardless of age
      if (!filters?.isMine && !user.isAdmin) {
        query = query.where((builder) => {
          builder
            // Show all non-pending_funding jobs
            .where("status", "!=", "pending_funding")
            // OR show pending_funding jobs created less than 24 hours ago
            .orWhere((subBuilder) => {
              subBuilder
                .where("status", "=", "pending_funding")
                .whereRaw("jobs.\"createdAt\" > NOW() - INTERVAL '24 hours'");
            });
        });
      }
      // Admin users: no pending_funding filter - they can see all jobs including pending ones
      if (filters?.minPay)
        query = query.where("payAmount", ">=", filters.minPay);
      if (filters?.maxPay)
        query = query.where("payAmount", "<=", filters.maxPay);

      if (filters?.location) {
        query = query.where((builder) =>
          builder
            .whereRaw(`("pickupLocation"->>'address') ILIKE ?`, [
              `%${filters.location}%`,
            ])
            .orWhereRaw(`("dropoffLocation"->>'address') ILIKE ?`, [
              `%${filters.location}%`,
            ])
        );
      }

      if (filters?.truckTypeIds) {
        const ids = filters.truckTypeIds
          .split("-")
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));

        if (ids.length > 0) {
          query = query.whereRaw(
            `cargo->'requiredTruckTypeIds' IS NOT NULL
             AND jsonb_typeof(cargo->'requiredTruckTypeIds') = 'array'
             AND EXISTS (
               SELECT 1
               FROM jsonb_array_elements_text(cargo->'requiredTruckTypeIds') AS elem
               WHERE elem::int = ANY(?::int[])
             )`,
            [ids]
          );
        }
      }

      // ✅ Search filter: if contains #number, search by ID; otherwise fuzzy search on title
      if (filters?.search) {
        // Decode URL-encoded characters (e.g., %23 becomes #)
        // Express usually decodes query params, but we decode explicitly to be safe
        let searchTerm: string;
        try {
          searchTerm = decodeURIComponent(filters.search.trim());
        } catch {
          // If decoding fails, use original string (might already be decoded)
          searchTerm = filters.search.trim();
        }

        // Check for #number pattern
        const idMatch = searchTerm.match(/#(\d+)/);

        if (idMatch) {
          // Extract number after # and search in job.id or parentJobId
          const jobId = parseInt(idMatch[1], 10);
          if (!isNaN(jobId)) {
            query = query.where((builder) => {
              builder
                .where("jobs.id", jobId)
                .orWhere("jobs.parentJobId", jobId);
            });
          }
        } else {
          // Fuzzy search on job title
          query = query.whereRaw(`jobs.title ILIKE ?`, [`%${searchTerm}%`]);
        }
      }

      // // If completed list is requested, eager load participants for display
      // const loadParticipants = filters?.status === "completed";
      // if (loadParticipants) {
      // augment query to join contracts and active participants
      query = query.withGraphFetched(
        "[contracts.contractParticipants.user.location]"
      );
      // }

      // ✅ Pagination setup
      const page = filters?.page ? Number(filters.page) : 1;
      const limit = filters?.limit ? Number(filters.limit) : 10;
      const offsetPage = page - 1;

      // ✅ Run paginated query
      const { results, total } = await query.page(offsetPage, limit);

      // Get root owner information for reshared jobs in a single query
      const resharedJobIds = results
        .filter((job) => job.parentJobId)
        .map((job) => job.id);
      let rootOwnersMap = new Map();

      if (resharedJobIds.length > 0) {
        const rootOwners = await this.getRootOwnersForJobs(resharedJobIds);
        rootOwnersMap = new Map(rootOwners.map((ro) => [ro.jobId, ro]));
      }

      const jobs = results.map((job: any) => {
        const base = {
          ...job,
          distance: parseFloat(job.distance) || 0,
          pricePerMile: parseFloat(job.pricePerMile) || 0,
        } as any;

        // Add root owner information for reshared jobs
        if (job.parentJobId && rootOwnersMap.has(job.id)) {
          const rootOwner = rootOwnersMap.get(job.id);
          base.rootOwner = {
            userId: rootOwner.userId,
            user: rootOwner.user,
            companyId: rootOwner.companyId,
            company: rootOwner.company,
          };
        }

        // if (loadParticipants) {
        const participants = (job.contracts || [])
          .flatMap((c: any) => c.contractParticipants || [])
          .filter(
            (p: any) =>
              p.status === "active" &&
              (p.role === "driver" || p.role === "carrier")
          )
          .map((p: any) => ({
            role: p.role,
            user: p.user
              ? {
                  id: p.user.id,
                  fullName: p.user.fullName,
                  email: p.user.email,
                }
              : null,
          }));
        base.participants = participants;
        // }
        return base;
      });

      return {
        jobs,
        pagination: {
          total, // ✅ total count based on filters
          totalPages: Math.ceil(total / limit),
          page,
          limit,
          count: jobs.length, // ✅ jobs in this page only
        },
      };
    } catch (error: any) {
      Logger.error(
        `Error getting visible jobs: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Assign a job to a driver
   */
  async assignJob(data: AssignJobData): Promise<JobAssignment> {
    try {
      // Validate job exists and is available
      const job = await Job.query()
        .findById(data.jobId)
        .withGraphFetched("company");

      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      if (job.status !== "active") {
        throw new HttpException("Job is not available for assignment", 400);
      }

      // Validate driver exists
      const driver = await Driver.query().findById(data.driverId);
      if (!driver) {
        throw new HttpException("Driver not found", 400);
      }

      // Check if driver is already assigned to this job
      const existingAssignment = await JobAssignment.query()
        .where({ jobId: data.jobId, driverId: data.driverId })
        .first();

      if (existingAssignment) {
        throw new HttpException("Driver is already assigned to this job", 400);
      }

      // Create job assignment
      const assignment = await JobAssignment.query().insert({
        jobId: data.jobId,
        driverId: data.driverId,
        assignedByCompanyId: data.assignedByCompanyId,
        assignmentType: data.assignmentType,
        status: "pending",
        notes: data.notes,
        assignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update job status
      await Job.query().patchAndFetchById(data.jobId, {
        status: "assigned",
        assignedDriverId: data.driverId,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Emit Socket.IO event for job assignment
      // emitJobAssigned(data.jobId, data.driverId, data.assignedByCompanyId);

      // Add system message to conversation
      // await emitSystemMessage(
      //   job.id,
      //   `Job assigned to driver ${driver.user?.firstName || 'Driver'} ${driver.user?.lastName || ''}`
      // );

      Logger.info(`Job ${data.jobId} assigned to driver ${data.driverId}`);
      return assignment;
    } catch (error: any) {
      Logger.error(`Error assigning job: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Auto-assign job (for short jobs like Uber)
   */
  async autoAssignJob(jobId: number): Promise<JobAssignment | null> {
    try {
      const job = await Job.query().findById(jobId);
      if (!job || job.assignmentType !== "auto") {
        return null;
      }

      // Find available drivers based on job requirements
      const availableDrivers = await Driver.query()
        .withGraphFetched("user")
        .where("isAvailable", true)
        .modify((queryBuilder) => {
          // Add driver filtering logic based on job requirements
          // e.g., location, vehicle type, rating, etc.
        })
        .limit(5);

      if (availableDrivers.length === 0) {
        return null;
      }

      // Select best driver (implement your selection algorithm)
      const selectedDriver = availableDrivers[0];

      // Assign job
      return await this.assignJob({
        jobId,
        driverId: selectedDriver.id,
        assignedByCompanyId: job.companyId,
        assignmentType: "auto",
        notes: "Auto-assigned by system",
      });
    } catch (error: any) {
      Logger.error(
        `Error auto-assigning job: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Create job contract and initiate escrow
   */
  async createContract(
    jobId: number,
    data: {
      driverId: number;
      contractAmount: number;
      startDate?: Date;
      endDate?: Date;
      terms?: string;
    }
  ): Promise<JobContract> {
    try {
      // Check if job exists and is available
      const job = await Job.query().findById(jobId);
      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      if (job.status !== "active") {
        throw new HttpException("Job is not available for contracting", 400);
      }

      // Check if driver is available
      const driver = await Driver.query().findById(data.driverId);
      if (!driver) {
        throw new HttpException("Driver not found", 404);
      }

      // Generate unique contract number
      const contractNumber = generateContractNumber();

      // Create contract as pending (invite flow)
      const contract = await JobContract.query().insert({
        jobId,
        driverId: data.driverId,
        companyId: job.companyId,
        contractNumber,
        status: "pending",
        contractAmount: data.contractAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        terms: data.terms,
      });

      // Create escrow record
      await Escrow.query().insert({
        contractId: contract.id,
        amount: data.contractAmount,
        status: "pending",
      });

      // Do not mark job assigned yet; await acceptance/start flow
      emitContractCreated(contract.id, {
        jobId,
        driverId: data.driverId,
        companyId: job.companyId,
        contractNumber,
        contractAmount: data.contractAmount,
      });

      Logger.info(
        `Contract created for job ${jobId} with driver ${data.driverId}`
      );

      return contract;
    } catch (error: any) {
      Logger.error(
        `Error creating contract: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Start contract and hold escrow
   */
  async startContract(
    contractId: number
  ): Promise<{ contract: JobContract; escrow: Escrow }> {
    try {
      const contract = await JobContract.query()
        .findById(contractId)
        .withGraphFetched("escrow");

      if (!contract) {
        throw new HttpException("Contract not found", 404);
      }

      if (contract.status !== "pending") {
        throw new HttpException("Contract cannot be started", 400);
      }

      // Update contract status
      const updatedContract = await JobContract.query().patchAndFetchById(
        contractId,
        {
          status: "active",
          startDate: new Date(),
        }
      );

      // Update escrow status to held
      const escrow = await Escrow.query().patchAndFetchById(
        contract.escrow!.id,
        {
          status: "held" as const,
        }
      );

      // Update job status
      await Job.query().patchAndFetchById(contract.jobId, {
        status: "in_progress",
        contractStartDate: new Date().toISOString(),
      });

      // Emit contract started event
      emitContractStarted(contractId, escrow.amount);

      Logger.info(`Contract ${contractId} started, escrow held`);

      return { contract: updatedContract, escrow };
    } catch (error: any) {
      Logger.error(
        `Error starting contract: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Complete job and release escrow
   */
  async completeJob(
    contractId: number
  ): Promise<{ contract: JobContract; escrow: Escrow }> {
    try {
      const contract = await JobContract.query()
        .findById(contractId)
        .withGraphFetched("escrow");

      if (!contract) {
        throw new HttpException("Contract not found", 404);
      }

      if (contract.status !== "active") {
        throw new HttpException("Contract cannot be completed", 400);
      }

      // Update contract status
      const updatedContract = await JobContract.query().patchAndFetchById(
        contractId,
        {
          status: "completed",
          endDate: new Date(),
        }
      );

      // Update escrow status to released
      const escrow = await Escrow.query().patchAndFetchById(
        contract.escrow!.id,
        {
          status: "released",
        }
      );

      // Update job status
      await Job.query().patchAndFetchById(contract.jobId, {
        status: "completed",
        contractEndDate: new Date().toISOString(),
      });

      // Emit job completed event
      emitJobCompleted(contractId, escrow.amount);

      Logger.info(`Job ${contract.jobId} completed, escrow released`);

      return { contract: updatedContract, escrow };
    } catch (error: any) {
      Logger.error(
        `Error completing job: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**

  /**
   * Get job details with all related information
   */
  async getJobDetails(jobId: number, user?: any): Promise<any> {
    try {
      const userRoleIds = user?.roles?.map((r: any) => r.roleId) || [];
      const userLat = user?.location?.lat;
      const userLng = user?.location?.lng;

      // ✅ Distance: user → pickup
      const userPickupDistanceSql = `
        3959 * acos(
          cos(radians(?)) * cos(radians(("pickupLocation"->>'lat')::float)) *
          cos(radians(("pickupLocation"->>'lng')::float) - radians(?)) +
          sin(radians(?)) * sin(radians(("pickupLocation"->>'lat')::float))
        )
      `;

      // ✅ Distance: pickup → dropoff
      const pickupDropoffDistanceSql = `
        3959 * acos(
          cos(radians(("pickupLocation"->>'lat')::float)) 
          * cos(radians(("dropoffLocation"->>'lat')::float))
          * cos(radians(("dropoffLocation"->>'lng')::float) - radians(("pickupLocation"->>'lng')::float))
          + sin(radians(("pickupLocation"->>'lat')::float)) 
          * sin(radians(("dropoffLocation"->>'lat')::float))
        )
      `;

      const useUserLocation = !!(userLat && userLng);

      const distanceExpr = useUserLocation
        ? raw(userPickupDistanceSql, [userLat, userLng, userLat])
        : raw(pickupDropoffDistanceSql);

      const pricePerMileExpr = useUserLocation
        ? raw(
            `(CASE WHEN (${userPickupDistanceSql}) > 0
              THEN (jobs."payAmount" / (${userPickupDistanceSql}))
              ELSE 0 END)`,
            [userLat, userLng, userLat, userLat, userLng, userLat]
          )
        : raw(
            `(CASE WHEN (${pickupDropoffDistanceSql}) > 0
              THEN (jobs."payAmount" / (${pickupDropoffDistanceSql}))
              ELSE 0 END)`
          );

      let query = Job.query()
        .findById(jobId)
        .withGraphFetched(
          "[company, jobApplications.[applicant.location, contracts.contractParticipants.user.location],visibilityRoles.role ,conversation, contracts.[contractParticipants.user.location, hiredByUser, hiredUser]]"
        )
        .select(
          "jobs.*",
          distanceExpr.as("distance"),
          pricePerMileExpr.as("pricePerMile")
        );

      // ✅ Role-based visibility (if needed)
      // if (userRoleIds.length > 0 && !user.isAdmin) {
      //   query = query.whereExists(
      //     Job.relatedQuery("visibilityRoles").whereIn("roleId", userRoleIds)
      //   );
      // }

      const job: any = await query;

      if (!job) {
        throw new HttpException("Job not found", 404);
      }

      // ✅ Format response like in getVisibleJobs
      return {
        ...job,
        distance: parseFloat(job?.distance) || 0,
        pricePerMile: parseFloat(job.pricePerMile) || 0,
      };
    } catch (error: any) {
      Logger.error(
        `Error getting job details: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Check if user has access to job
   */
  async checkJobAccess(jobId: number, userId: number): Promise<boolean> {
    try {
      const job = await Job.query()
        .findById(jobId)
        .withGraphFetched("[company, assignedDriver, visibilityRoles]");

      if (!job) {
        return false;
      }

      // For now, return true - implement proper access control later
      return true;
    } catch (error: any) {
      Logger.error(
        `Error checking job access: ${error?.message || "Unknown error"}`
      );
      return false;
    }
  }

  /**
   * Get job assignments
   */
  async getJobAssignments(jobId: number): Promise<JobAssignment[]> {
    try {
      return await JobAssignment.query()
        .where({ jobId })
        .withGraphFetched("driver")
        .orderBy("createdAt", "desc");
    } catch (error: any) {
      Logger.error(
        `Error getting job assignments: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Update a job if not assigned and has no applications
   */
  async updateJob(
    jobId: number,
    companyId: number,
    payload: Partial<CreateJobData>
  ): Promise<Job> {
    const job = await Job.query().findById(jobId);
    if (!job) throw new HttpException("Job not found", 404);
    if (job.companyId !== companyId) throw new HttpException("Forbidden", 403);
    if (job.status !== "active" && job.status !== "draft") {
      throw new HttpException("Job cannot be updated in current status", 400);
    }
    const appCount = await JobApplication.query().where({ jobId }).resultSize();
    if (appCount > 0)
      throw new HttpException(
        "Job has applications and cannot be updated",
        400
      );
    const updated = await Job.query().patchAndFetchById(jobId, {
      ...payload,
      updatedAt: new Date().toISOString(),
    } as any);
    return updated;
  }

  /**
   * Delete a job if not assigned and no applications
   */
  async deleteJob(
    jobId: number,
    companyId: number
  ): Promise<{ success: true }> {
    const job = await Job.query().findById(jobId);
    if (!job) throw new HttpException("Job not found", 404);
    if (job.companyId !== companyId) throw new HttpException("Forbidden", 403);
    if (job.status !== "active" && job.status !== "draft") {
      throw new HttpException("Job cannot be deleted in current status", 400);
    }
    const appCount = await JobApplication.query().where({ jobId }).resultSize();
    if (appCount > 0)
      throw new HttpException(
        "Job has applications and cannot be deleted",
        400
      );
    const contracts = await Contract.query()
      .where({ jobId })
      .whereIn("status", ["active", "pending", "onHold"]);
    if (contracts.length > 0)
      throw new HttpException("Job has contracts and cannot be deleted", 400);
    await Job.query().deleteById(jobId);
    return { success: true };
  }

  /**
   * Reshare a job (create a new job with same details but different price)
   * Only assigned users (with contracts) or admins can reshare
   */
  async reshareJob(
    jobId: number,
    newPayAmount: number,
    userId: number,
    userRole: string,
    companyId: number,
    visibleToRoles?: number[]
  ): Promise<Job> {
    try {
      // Get the original job
      const originalJob = await Job.query()
        .findById(jobId)
        .withGraphFetched("[company, visibilityRoles]");

      if (!originalJob) {
        throw new HttpException("Job not found", 404);
      }

      // Check if user is admin
      const isAdmin = userRole === "admin";

      // If not admin, check if user has a contract or subcontract for this job
      if (!isAdmin) {
        // Check if user is hiredUserId in a direct contract for this job
        const contract = await Contract.query()
          .where({ jobId, hiredUserId: userId })
          .whereIn("status", ["active", "pending", "onHold"])
          .first();

        // If no direct contract, check if user is hiredUserId in a subcontract related to this job
        let hasSubContract = false;
        if (!contract) {
          const subContract = await SubContract.query()
            .joinRelated("subContract")
            .where("subContract.hiredUserId", userId)
            .where("subContract.jobId", jobId)
            .whereIn("subContract.status", ["active", "pending", "onHold"])
            .first();

          hasSubContract = !!subContract;
        }

        if (!contract && !hasSubContract) {
          throw new HttpException(
            "Only hired users or admins can reshare jobs",
            403
          );
        }
      }

      // Check if user has already reshared this job
      const existingReshare = await Job.query()
        .where({ parentJobId: jobId, userId: userId })
        .whereIn("status", ["active", "pending", "onHold"])
        .first();

      if (existingReshare) {
        throw new HttpException("You have already reshared this job", 400);
      }

      // Additional safety check: prevent resharing if this would create a circular reference
      // This shouldn't happen with proper constraints, but extra safety
      if (originalJob.parentJobId === jobId) {
        throw new HttpException(
          "Cannot reshare job: would create circular reference",
          400
        );
      }

      // Clone the job with new price - use reshare user as poster
      const resharedJobData = {
        userId: userId, // Reshare user becomes the poster
        companyId: companyId, // Use reshare user's company
        parentJobId: originalJob.id,
        title: originalJob.title,
        description: originalJob.description,
        payAmount: newPayAmount,
        jobType: originalJob.jobType,
        status: "active" as const,
        assignmentType: originalJob.assignmentType,
        startDate: (originalJob.startDate as any)?.toISOString?.(),
        endDate: (originalJob.endDate as any)?.toISOString?.(),
        tonuAmount: originalJob.tonuAmount,
        isTonuEligible: originalJob.isTonuEligible,
        pickupLocation: originalJob.pickupLocation,
        dropoffLocation: originalJob.dropoffLocation,
        cargo: originalJob.cargo,
        specialRequirements: originalJob.specialRequirements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Execute all database operations in a transaction
      const resharedJob = await Job.transaction(async (trx) => {
        // Create the new job
        const resharedJob = await Job.query(trx).insertAndFetch(
          resharedJobData
        );

        // Set visibility roles for the reshared job
        if (visibleToRoles && visibleToRoles.length > 0) {
          const visibilityRoles = visibleToRoles.map((roleId, index) => ({
            jobId: resharedJob.id,
            roleId,
            sortOrder: index,
          }));
          await JobVisibilityRole.query(trx).insert(visibilityRoles);
        } else if (
          originalJob.visibilityRoles &&
          originalJob.visibilityRoles.length > 0
        ) {
          // Fallback: copy visibility roles from original job if none provided
          const visibilityRoles = originalJob.visibilityRoles.map((role) => ({
            jobId: resharedJob.id,
            roleId: role.roleId,
          }));
          await JobVisibilityRole.query(trx).insert(visibilityRoles);
        }

        return resharedJob;
      });

      Logger.info(
        `Job ${jobId} reshared as job ${resharedJob.id} by user ${userId}`
      );
      return resharedJob;
    } catch (error: any) {
      Logger.error(`Error resharing job: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Find root job and get its main conversation for application acceptance
   */
  async getRootJobConversation(jobId: number): Promise<Conversation | null> {
    try {
      const rootJob = await Job.findRootJob(jobId);
      if (!rootJob) {
        return null;
      }

      // Get the main conversation for the root job
      const conversation = await Conversation.query()
        .where({ jobId: rootJob.id })
        .first();

      return conversation || null;
    } catch (error: any) {
      Logger.error(
        `Error getting root job conversation: ${
          error?.message || "Unknown error"
        }`
      );
      return null;
    }
  }

  /**
   * Get job statistics
   * Returns total jobs, active jobs, completed jobs, assigned/in-progress jobs, and total payAmount
   */
  async getJobStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    assignedAndInProgressJobs: number;
    totalPayAmount: number;
    pendingFundingJobs: number;
  }> {
    try {
      // Get total jobs count
      const totalJobs = await Job.query().count("* as count").first();

      // Get active jobs count (status = 'active')
      const activeJobs = await Job.query()
        .where("status", "active")
        .count("* as count")
        .first();

      // Get completed jobs count (status = 'completed' or 'partially_completed')
      const completedJobs = await Job.query()
        .whereIn("status", ["completed", "partially_completed"])
        .count("* as count")
        .first();

      // Get assigned and in-progress jobs count (status = 'assigned' or 'in_progress')
      const assignedAndInProgressJobs = await Job.query()
        .whereIn("status", ["assigned", "in_progress"])
        .count("* as count")
        .first();

      const pendingFundingJobs = await Job.query()
        .whereIn("status", ["pending_funding"])
        .count("* as count")
        .first();
      // Get total payAmount (sum of all payAmount)
      const totalPayAmountResult = await Job.query()
        .sum("payAmount as total")
        .first();

      return {
        totalJobs: parseInt((totalJobs as any)?.count || "0", 10),
        activeJobs: parseInt((activeJobs as any)?.count || "0", 10),
        completedJobs: parseInt((completedJobs as any)?.count || "0", 10),
        assignedAndInProgressJobs: parseInt(
          (assignedAndInProgressJobs as any)?.count || "0",
          10
        ),
        totalPayAmount: parseFloat((totalPayAmountResult as any)?.total || "0"),
        pendingFundingJobs: parseInt(
          (pendingFundingJobs as any)?.count || "0",
          10
        ),
      };
    } catch (error: any) {
      Logger.error(
        `Error getting job stats: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }
}
