import { Contract, User, Job } from "../../models";
import { RatingService } from "../rating";

export class DashboardService {
  private ratingService = new RatingService();

  async getUserDashboard(userId: number) {
    // Get total completed jobs count
    // User can be involved as: hiredByUserId, hiredUserId, or participant
    const completedContractsCount = await Contract.query()
      .where("status", "completed")
      .where((qb) => {
        qb.where("hiredByUserId", userId)
          .orWhere("hiredUserId", userId)
          .orWhereExists(
            Contract.relatedQuery("contractParticipants")
              .where("contractParticipants.userId", userId)
              .where("contractParticipants.status", "active")
          );
      })
      .resultSize();

    // Get ratings using existing getUserRatings function
    const ratings = await this.ratingService.getUserRatings(userId);

    return {
      totalCompletedJobs: completedContractsCount,
      ratings: {
        average: ratings.summary.average,
        count: ratings.summary.count,
      },
    };
  }

  async getAdminDashboard() {
    // Get total users count
    const totalUsers = await User.query().count("* as count").first();

    // Get active jobs count
    const activeJobs = await Job.query()
      .where("status", "active")
      .count("* as count")
      .first();

    // Get recent jobs (last 5)
    const recentJobs = await Job.query()
      .withGraphFetched("company")
      .orderBy("createdAt", "desc")
      .limit(5);

    // Get total revenue from completed jobs (sum of payAmount for completed jobs)
    const totalRevenueResult = await Job.query()
      .whereIn("status", ["completed", "partially_completed"])
      .sum("payAmount as total")
      .first();

    // Get open disputes count (if disputes table exists, otherwise return 0)
    // For now, we'll return 0 as disputes might not be implemented yet
    const openDisputes = 0;

    return {
      totalUsers: parseInt((totalUsers as any)?.count || "0", 10),
      activeJobs: parseInt((activeJobs as any)?.count || "0", 10),
      totalRevenue: parseFloat((totalRevenueResult as any)?.total || "0"),
      openDisputes,
      recentJobs: recentJobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || "N/A",
        status: job.status,
        amount: job.payAmount,
        createdAt: job.createdAt,
      })),
    };
  }
}

