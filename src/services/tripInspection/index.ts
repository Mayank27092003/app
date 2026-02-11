import { transaction } from "objection";
import { Contract, ContractParticipant, Driver, UserRole } from "../../models";
import { TripInspection } from "../../models/tripInspection";
import { HttpException } from "../../utils/httpException";

export class TripInspectionService {
  private async ensureActiveDriver(
    contractId: number,
    userId: number,
    trx?: any
  ) {
    const contract = await Contract.query(trx).findById(contractId);
    if (!contract) throw new HttpException("Contract not found", 404);
    
    // First, verify the user is actually a driver
    const driverProfile = await Driver.query(trx).where({ userId }).first();
    if (!driverProfile) {
      throw new HttpException("You are not a registered driver", 403);
    }
    // Check if user has access to this specific contract
    const isDirectDriver = contract.hiredUserId === userId;
    const participant = await ContractParticipant.query(trx)
      .where({ contractId, userId, role: "driver", status: "active" })
      .first();
    
    if (!isDirectDriver && !participant) {
      throw new HttpException(
        "You are not an active driver on this contract",
        403
      );
    }
    
    return contract;
  }

  async startInspection(
    contractId: number,
    userId: number,
    type: "pre" | "post"
  ) {
    return await transaction(TripInspection.knex(), async (trx) => {
      await this.ensureActiveDriver(contractId, userId, trx);

      // Prevent duplicate started inspections of same type
      const existing = await TripInspection.query(trx)
        .where({ contractId, driverUserId: userId, type })
        .whereIn("status", ["started", "completed", "submitted"])
        .first();

      if (existing) return existing;

      // 🚨 If trying to start "post", ensure "pre" exists and is completed
      if (type === "post") {
        const preInspection = await TripInspection.query(trx)
          .where({ contractId, driverUserId: userId, type: "pre" })
          .orderBy("createdAt", "desc") // latest pre inspection
          .first();

        if (!preInspection || preInspection.status !== "completed") {
          throw new HttpException(
            "Cannot start post inspection before pre inspection is completed.",
            400
          );  
        }
      }

      const now = new Date().toISOString();

      return await TripInspection.query(trx).insertAndFetch({
        contractId,
        type,
        driverUserId: userId,
        status: "started",
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  async completeInspection(
    inspectionId: number,
    userId: number,
    payload: { data?: any; defects?: any; photos?: any[]; podPhoto?: any }
  ) {
    return await transaction(TripInspection.knex(), async (trx) => {
      const insp = await TripInspection.query(trx).findById(inspectionId);
      if (!insp) throw new HttpException("Inspection not found", 404);
      await this.ensureActiveDriver(insp.contractId, userId, trx);
      if (insp.driverUserId !== userId)
        throw new HttpException("Not owner of this inspection", 403);
      if (insp.status === "submitted")
        throw new HttpException("Already submitted", 400);
      const now = new Date().toISOString();
      return await TripInspection.query(trx).patchAndFetchById(inspectionId, {
        status: "completed",
        completedAt: now,
        data: payload?.data ?? insp.data,
        defects: payload?.defects ?? insp.defects,
        photos: payload?.photos ?? insp.photos,
        podPhoto: payload?.podPhoto ?? (insp as any).podPhoto,
        updatedAt: now,
      });
    });
  }

  async submitForPayment(contractId: number, userId: number) {
    return await transaction(TripInspection.knex(), async (trx) => {
      await this.ensureActiveDriver(contractId, userId, trx);
      const inspections = await TripInspection.query(trx).where({
        contractId,
        driverUserId: userId,
      });
      const pre = inspections.find(
        (x) => x.type === "pre" && x.status === "completed"
      );
      const post = inspections.find(
        (x) => x.type === "post" && x.status === "completed"
      );
      if (!pre || !post)
        throw new HttpException("Pre and Post trip must be completed", 400);
      const now = new Date().toISOString();
      // mark both as submitted
      await TripInspection.query(trx)
        .patch({ status: "submitted", submittedAt: now, updatedAt: now })
        .whereIn("id", [pre.id, post.id]);
      return { success: true };
    });
  }

  async getMyInspections(contractId: number, userId: number) {
    // await this.ensureActiveDriver(contractId, userId);
    return TripInspection.query()
      .where({ contractId })
      .orderBy("createdAt", "asc");
  }
}
