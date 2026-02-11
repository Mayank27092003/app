import { transaction } from "objection";
import { Contract, ContractParticipant, User, UserRating } from "../../models";
import { HttpException } from "../../utils/httpException";

export class RatingService {
  private async canRate(contractId: number, raterUserId: number, rateeUserId: number, trx?: any) {
    // Get the contract (could be root or child)
    let contract = await Contract.query(trx).findById(contractId);
    if (!contract) throw new HttpException("Contract not found", 404);

    // If this is a child contract, get the root contract for checking
    let rootContract = contract;
    if (contract.parentContractId) {
      // Traverse up to find root contract
      let current = contract;
      while (current.parentContractId) {
        const parent = await Contract.query(trx).findById(current.parentContractId);
        if (!parent) break;
        rootContract = parent;
        current = parent;
      }
    }

    // Check if contract is completed (either current or root contract must be completed)
    const isCompleted = contract.status === "completed" || rootContract.status === "completed";
    if (!isCompleted) {
      throw new HttpException("Can rate only after contract completion", 400);
    }

    // Check if rater is involved in the contract
    // Rater can be: hiredByUserId, hiredUserId, OR a participant
    const isRaterHiredBy = contract.hiredByUserId === raterUserId || rootContract.hiredByUserId === raterUserId;
    const isRaterHired = contract.hiredUserId === raterUserId || rootContract.hiredUserId === raterUserId;
    const raterParticipant = await ContractParticipant.query(trx)
      .where({ contractId: contract.id, userId: raterUserId, status: "active" })
      .first();
    const rootRaterParticipant = rootContract.id !== contract.id
      ? await ContractParticipant.query(trx)
          .where({ contractId: rootContract.id, userId: raterUserId, status: "active" })
          .first()
      : null;

    if (!isRaterHiredBy && !isRaterHired && !raterParticipant && !rootRaterParticipant) {
      throw new HttpException("You must be part of the contract to rate", 403);
    }

    // Check if ratee is involved in the contract
    // Ratee can be: hiredByUserId, hiredUserId, OR a participant
    const isRateeHiredBy = contract.hiredByUserId === rateeUserId || rootContract.hiredByUserId === rateeUserId;
    const isRateeHired = contract.hiredUserId === rateeUserId || rootContract.hiredUserId === rateeUserId;
    const rateeParticipant = await ContractParticipant.query(trx)
      .where({ contractId: contract.id, userId: rateeUserId })
      .first();
    const rootRateeParticipant = rootContract.id !== contract.id
      ? await ContractParticipant.query(trx)
          .where({ contractId: rootContract.id, userId: rateeUserId })
          .first()
      : null;

    if (!isRateeHiredBy && !isRateeHired && !rateeParticipant && !rootRateeParticipant) {
      throw new HttpException("The user being rated must be part of the contract", 403);
    }

    // Cannot rate yourself
    if (raterUserId === rateeUserId) {
      throw new HttpException("Cannot rate yourself", 400);
    }
  }

  async createOrUpdate(contractId: number, raterUserId: number, rateeUserId: number, stars: number, comment?: string) {
    return await transaction(UserRating.knex(), async (trx) => {
      await this.canRate(contractId, raterUserId, rateeUserId, trx);
      const existing = await UserRating.query(trx)
        .where({ contractId, raterUserId, rateeUserId })
        .first();
      const now = new Date().toISOString();
      if (existing) {
        return await UserRating.query(trx).patchAndFetchById(existing.id, { stars, comment, updatedAt: now });
      }
      return await UserRating.query(trx).insertAndFetch({ contractId, raterUserId, rateeUserId, stars, comment, createdAt: now, updatedAt: now });
    });
  }

  async getUserRatings(userId: number, filterByRaterId?: number) {
    // Build where clause - if filterByRaterId is provided, filter by raterUserId
    const whereClause: any = { rateeUserId: userId };
    if (filterByRaterId) {
      whereClause.raterUserId = filterByRaterId;
    }

    // Use CTE pipeline to return summary + recent reviews in one roundtrip
    const knex = UserRating.knex();
    const row = await knex
      .with("agg", (qb) =>
        qb
          .from("userRatings")
          .where(whereClause)
          .select(knex.raw("avg(stars)::float as average"), knex.raw("count(id)::int as count"))
      )
      .with("rev", (qb) =>
        qb
          .from("userRatings")
          .where(whereClause)
          .orderBy("createdAt", "desc")
          .limit(50)
          .select("id", "contractId", "raterUserId", "rateeUserId", "stars", "comment", "createdAt")
      )
      .select(
        knex.raw("(select average from agg) as average"),
        knex.raw("(select count from agg) as count"),
        knex.raw("(select coalesce(json_agg(rev.*), '[]'::json) from rev) as reviews")
      )
      .first();

    return {
      summary: { average: Number(row?.average) || 0, count: Number(row?.count) || 0 },
      reviews: row?.reviews || [],
    } as any;
  }

  async getRatingsGivenByUser(userId: number, filterByRateeId?: number) {
    // Build where clause - get all ratings given by this user
    const whereClause: any = { raterUserId: userId };
    if (filterByRateeId) {
      whereClause.rateeUserId = filterByRateeId;
    }

    // Get all ratings with full graph fetched data
    const ratings = await UserRating.query()
      .where(whereClause)
      .withGraphFetched({
        contract: {
          job: true,
          parentContract: true,
          contractParticipants: {
            user: true,
          },
        },
        ratee: {
          roles: {
            role: true,
          },
          company: true,
          driver: true,
        },
      })
      .orderBy("createdAt", "desc");

    return {
      count: ratings.length,
      ratings: ratings,
    };
  }

  async updateRating(
    ratingId: number,
    raterUserId: number,
    stars: number,
    comment?: string
  ) {
    return await transaction(UserRating.knex(), async (trx) => {
      const rating = await UserRating.query(trx).findById(ratingId);
      if (!rating) throw new HttpException("Rating not found", 404);

      // Verify the rater owns this rating
      if (rating.raterUserId !== raterUserId) {
        throw new HttpException("You can only update your own ratings", 403);
      }

      // Re-validate rating permissions
      await this.canRate(rating.contractId, raterUserId, rating.rateeUserId, trx);

      const now = new Date().toISOString();
      return await UserRating.query(trx).patchAndFetchById(ratingId, {
        stars,
        comment,
        updatedAt: now,
      });
    });
  }

  async deleteRating(ratingId: number, raterUserId: number) {
    return await transaction(UserRating.knex(), async (trx) => {
      const rating = await UserRating.query(trx).findById(ratingId);
      if (!rating) throw new HttpException("Rating not found", 404);

      // Verify the rater owns this rating
      if (rating.raterUserId !== raterUserId) {
        throw new HttpException("You can only delete your own ratings", 403);
      }

      await UserRating.query(trx).deleteById(ratingId);
      return { success: true, message: "Rating deleted successfully" };
    });
  }

  async getContractRatings(contractId: number) {
    // Verify contract exists
    const contract = await Contract.query().findById(contractId);
    if (!contract) throw new HttpException("Contract not found", 404);

    // Get all ratings for this contract with full populated data
    const ratings = await UserRating.query()
      .where({ contractId })
      .withGraphFetched({
        rater: {
          roles: {
            role: true,
          },
          company: true,
          driver: true,
        },
        ratee: {
          roles: {
            role: true,
          },
          company: true,
          driver: true,
        },
      })
      .orderBy("createdAt", "desc");

    return {
      contractId,
      count: ratings.length,
      ratings: ratings,
    };
  }
}


