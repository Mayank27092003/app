import { transaction } from "objection";
import { Contract, JobApplication, Conversation, ConversationParticipant, ContractParticipant, ContractParticipantHistory } from "../../models";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { getSocketService } from "../socket/instance";

export class ContractParticipantService {
  private async createHistoryRecord(data: {
    participantId?: number | null;
    userId: number;
    action: "added" | "removed" | "roleChanged" | "statusChanged";
    changedByUserId: number;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    trx?: any;
  }) {
    return await ContractParticipantHistory.query(data.trx).insert({
      contractParticipantId: data.participantId,
      userId: data.userId,
      action: data.action,
      changedByUserId: data.changedByUserId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      reason: data.reason,
      changedAt: new Date().toISOString(),
    } as any);
  }

  private async getConversationIdForContract(contractId: number, trx?: any): Promise<number | null> {
    // 1) Try via job application link
    const contract = await Contract.query(trx).findById(contractId);
    if (!contract) throw new HttpException("Contract not found", 404);

    if (contract.jobApplicationId) {
      const app = await JobApplication.query(trx).findById(contract.jobApplicationId);
      if (app?.conversationId) return app.conversationId;
    }
    // 2) Fallback: find conversation by title pattern
    const conv = await Conversation.query(trx)
      .where("title", "ilike", `Contract #${contractId}%`)
      .first();
    return conv?.id ?? null;
  }

  async addDriver(contractId: number, driverUserId: number, addedByUserId: number) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const contract = await Contract.query(trx).findById(contractId);
      if (!contract) throw new HttpException("Contract not found", 404);

      // No limit on number of drivers; broker can manage visibility separately

      // If already active, do nothing
      const existing = await ContractParticipant.query(trx)
        .where({ contractId, userId: driverUserId, role: "driver" })
        .first();
      if (existing && existing.status === "active") return existing;

      // Invite flow: set status to invited, driver must accept to become active
      const participant = existing
        ? await ContractParticipant.query(trx).patchAndFetchById(existing.id, {
          status: existing.status === "removed" ? "invited" : existing.status,
          updatedAt: new Date().toISOString(),
        })
        : await ContractParticipant.query(trx).insertAndFetch({
          contractId,
          userId: driverUserId,
          role: "driver",
          status: "invited",
          addedByUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      // History log: added or re-activated
      await this.createHistoryRecord({
        participantId: participant.id,
        userId: driverUserId,
        action: existing ? "statusChanged" : "added",
        changedByUserId: addedByUserId,
        oldValue: existing ? { status: existing.status } : null,
        newValue: { status: "active" },
        trx
      });

      // Add to chat as viewer so driver can read but not send messages
      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        const exists = await ConversationParticipant.query(trx)
          .where({ conversationId, userId: driverUserId })
          .first();
        if (!exists) {
          await ConversationParticipant.query(trx).insert({
            conversationId,
            userId: driverUserId,
            joinedAt: new Date().toISOString(),
            role: "driver",
          });
        } else if ((exists as any).role !== "member") {
          await ConversationParticipant.query(trx)
            .patch({ role: "driver" })
            .where({ id: (exists as any).id });
        }
      }

      Logger.info(`Driver ${driverUserId} added to contract ${contractId}`);
      try {
        getSocketService().emitContractDriverInvited(contractId, driverUserId);
      } catch { }
      return participant;
    });
  }

  /**
   * Carrier invite/assignment. Carrier is immutable once set: cannot be changed after activation.
   * If a carrier exists with status active, block adding another.
   */
  async addCarrier(contractId: number, carrierUserId: number, addedByUserId: number) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const contract = await Contract.query(trx).findById(contractId);
      if (!contract) throw new HttpException("Contract not found", 404);

      // Check if an active carrier already exists (immutable rule)
      const existingActiveCarrier = await ContractParticipant.query(trx)
        .where({ contractId, role: "carrier", status: "active" })
        .first();
      if (existingActiveCarrier) {
        throw new HttpException("Carrier already set and cannot be changed", 400);
      }

      // If there is an invited carrier, allow updating same user or decline first
      const existingCarrier = await ContractParticipant.query(trx)
        .where({ contractId, role: "carrier" })
        .first();

      const participant = existingCarrier
        ? await ContractParticipant.query(trx).patchAndFetchById(existingCarrier.id, {
          userId: carrierUserId,
          status: "invited",
          updatedAt: new Date().toISOString(),
        })
        : await ContractParticipant.query(trx).insertAndFetch({
          contractId,
          userId: carrierUserId,
          role: "carrier",
          status: "invited",
          addedByUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      await this.createHistoryRecord({
        participantId: participant.id,
        userId: carrierUserId,
        action: existingCarrier ? "statusChanged" : "added",
        changedByUserId: addedByUserId,
        oldValue: existingCarrier ? { status: (existingCarrier as any).status } : null,
        newValue: { status: "invited" },
        trx
      });

      // Add to conversation as read-only until acceptance
      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        const exists = await ConversationParticipant.query(trx)
          .where({ conversationId, userId: carrierUserId })
          .first();
        if (!exists) {
          await ConversationParticipant.query(trx).insert({
            conversationId,
            userId: carrierUserId,
            joinedAt: new Date().toISOString(),
            role: "member",
          });
        }
      }

      try {
        getSocketService()?.emitContractCarrierInvited?.(contractId, carrierUserId);
      } catch { }
      return participant;
    });
  }

  async acceptCarrierInvite(contractId: number, carrierUserId: number) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      // Ensure no other active carrier (immutability)
      const existingActive = await ContractParticipant.query(trx)
        .where({ contractId, role: "carrier", status: "active" })
        .first();
      if (existingActive) throw new HttpException("Carrier already set", 400);

      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: carrierUserId, role: "carrier" })
        .first();
      if (!participant) throw new HttpException("Carrier invitation not found", 404);
      if (participant.status !== "invited") throw new HttpException("Invite not pending", 400);

      const updated = await ContractParticipant.query(trx).patchAndFetchById(participant.id, {
        status: "active",
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await this.createHistoryRecord({
        participantId: participant.id,
        userId: carrierUserId,
        action: "statusChanged",
        changedByUserId: carrierUserId,
        oldValue: { status: "invited" },
        newValue: { status: "active" },
        trx
      });

      try {
        getSocketService().emitContractCarrierAccepted(contractId, carrierUserId);
      } catch { }
      return updated;
    });
  }

  async declineCarrierInvite(contractId: number, carrierUserId: number, reason?: string) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: carrierUserId, role: "carrier" })
        .first();
      if (!participant) throw new HttpException("Carrier invitation not found", 404);
      if (participant.status !== "invited") throw new HttpException("Invite not pending", 400);

      // Create history record BEFORE deleting the participant - use userId instead of participantId
      await this.createHistoryRecord({
        participantId: null, // Set to null since we're about to delete the participant
        userId: carrierUserId,
        action: "removed",
        changedByUserId: carrierUserId,
        oldValue: { status: "invited" },
        newValue: { status: "removed" },
        reason,
        trx
      });

      await ContractParticipant.query(trx).deleteById(participant.id);

      // Remove from chat if present
      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        await ConversationParticipant.query(trx)
          .where({ conversationId, userId: carrierUserId })
          .delete();
      }

      try {
        getSocketService().emitContractCarrierDeclined(contractId, carrierUserId, reason);
      } catch { }
      return { success: true };
    });
  }

  async acceptInvite(contractId: number, driverUserId: number) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: driverUserId, role: "driver" })
        .first();
      if (!participant) throw new HttpException("Invitation not found", 404);
      if (participant.status === "active") return participant;
      if (participant.status !== "invited") throw new HttpException("Invite not pending", 400);

      const updated = await ContractParticipant.query(trx).patchAndFetchById(participant.id, {
        status: "active",
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await this.createHistoryRecord({
        participantId: participant.id,
        userId: driverUserId,
        action: "statusChanged",
        changedByUserId: driverUserId,
        oldValue: { status: "invited" },
        newValue: { status: "active" },
        trx
      });

      // Now upgrade chat role on accept
      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        const exists = await ConversationParticipant.query(trx)
          .where({ conversationId, userId: driverUserId })
          .first();
        if (!exists) {
          await ConversationParticipant.query(trx).insert({
            conversationId,
            userId: driverUserId,
            joinedAt: new Date().toISOString(),
            role: "member",
          });
        } else if ((exists as any).role !== "member") {
          await ConversationParticipant.query(trx)
            .patch({ role: "member" })
            .where({ id: (exists as any).id });
        }
      }

      try {
        getSocketService().emitContractDriverAccepted(contractId, driverUserId, conversationId ?? undefined);
      } catch { }

      return updated;
    });
  }

  async declineInvite(contractId: number, driverUserId: number, reason?: string) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: driverUserId, role: "driver" })
        .first();
      if (!participant) throw new HttpException("Invitation not found", 404);
      if (participant.status !== "invited") throw new HttpException("Invite not pending", 400);

      // Create history record BEFORE deleting the participant - use userId instead of participantId
      await this.createHistoryRecord({
        participantId: null, // Set to null since we're about to delete the participant
        userId: driverUserId,
        action: "removed",
        changedByUserId: driverUserId,
        oldValue: { status: "invited" },
        newValue: { status: "removed" },
        reason,
        trx
      });

      await ContractParticipant.query(trx).deleteById(participant.id);

      // Remove from chat if present
      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        await ConversationParticipant.query(trx)
          .where({ conversationId, userId: driverUserId })
          .delete();
      }

      try {
        getSocketService().emitContractDriverDeclined(contractId, driverUserId, reason);
      } catch { }
      return { success: true };
    });
  }

  async removeDriver(contractId: number, driverUserId: number, removedByUserId: number, reason?: string) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: driverUserId, role: "driver", status: "active" })
        .first();
      if (!participant) throw new HttpException("Driver is not an active participant on this contract", 404);

      const updated = await ContractParticipant.query(trx).patchAndFetchById(participant.id, {
        status: "removed",
        removedAt: new Date().toISOString(),
        removedByUserId,
        reasonForChange: reason,
        updatedAt: new Date().toISOString(),
      });

      // History log: removed
      await this.createHistoryRecord({
        participantId: participant.id,
        userId: driverUserId,
        action: "removed",
        changedByUserId: removedByUserId,
        oldValue: { status: participant.status },
        newValue: { status: updated.status, reasonForChange: reason },
        reason,
        trx
      });

      const conversationId = await this.getConversationIdForContract(contractId, trx);
      if (conversationId) {
        await ConversationParticipant.query(trx)
          .where({ conversationId, userId: driverUserId })
          .delete();
      }

      Logger.info(`Driver ${driverUserId} removed from contract ${contractId}`);
      try {
        getSocketService().emitContractDriverRemoved(contractId, driverUserId, reason, conversationId ?? undefined);
      } catch { }
      return { success: true };
    });
  }

  async changeDriver(contractId: number, currentDriverUserId: number | null, newDriverUserId: number, changedByUserId: number, reason: string) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      // Optional: remove current driver if provided
      if (currentDriverUserId) {
        const existing = await ContractParticipant.query(trx)
          .where({ contractId, userId: currentDriverUserId, role: "driver" })
          .first();
        if (existing) {
          const before = { status: existing.status };
          const after = await ContractParticipant.query(trx).patchAndFetchById(existing.id, {
            status: "removed",
            removedAt: new Date().toISOString(),
            removedByUserId: changedByUserId,
            reasonForChange: reason,
            updatedAt: new Date().toISOString(),
          });
          // History log for removal in change-driver
          await this.createHistoryRecord({
            participantId: existing.id,
            userId: currentDriverUserId,
            action: "removed",
            changedByUserId,
            oldValue: before,
            newValue: { status: after.status, reasonForChange: reason },
            reason,
            trx
          });
        }
        // Remove from chat as well
        const conversationId = await this.getConversationIdForContract(contractId, trx);
        if (conversationId) {
          await ConversationParticipant.query(trx)
            .where({ conversationId, userId: currentDriverUserId })
            .delete();
        }
      }

      // Add the new driver (will enforce max 2 drivers)
      const added = await this.addDriver(contractId, newDriverUserId, changedByUserId);
      try {
        getSocketService().emitContractDriverChanged(contractId, newDriverUserId, currentDriverUserId ?? undefined, reason, await this.getConversationIdForContract(contractId, trx) ?? undefined);
      } catch { }
      return { success: true, participant: added };
    });
  }

  async getMyInvites(userId: number, filters: { role?: string } = {}) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      const query = ContractParticipant.query(trx)
        .alias("cp")
        .joinRelated("contract.job")
        .select("cp.*")
        .where("cp.userId", userId)
        .where("cp.status", "invited")
        .modify((qb) => {
          if (filters?.role) {
            qb.where("role", filters?.role);
          }
        })
        .withGraphFetched("contract.job");


      const invites = await query;
      return invites;
    });
  }


  async setDriverLocationVisibility(contractId: number, driverUserId: number, isLocationVisible: boolean, changedByUserId: number) {
    return await transaction(ContractParticipant.knex(), async (trx) => {
      // Ensure participant exists
      const participant = await ContractParticipant.query(trx)
        .where({ contractId, userId: driverUserId, role: "driver" })
        .first();
      if (!participant) throw new HttpException("Driver not a contract participant", 404);

      // If setting visible=true, unset others for this contract
      if (isLocationVisible) {
        await ContractParticipant.query(trx)
          .where({ contractId, role: "driver" })
          .patch({ isLocationVisible: false });
      }

      const updated = await ContractParticipant.query(trx)
        .patchAndFetchById(participant.id, {
          isLocationVisible,
          updatedAt: new Date().toISOString(),
        });

      // History log
      await this.createHistoryRecord({
        participantId: participant.id,
        userId: driverUserId,
        action: "statusChanged",
        changedByUserId,
        oldValue: { isLocationVisible: participant.isLocationVisible ?? false },
        newValue: { isLocationVisible },
        trx
      });

      try {
        getSocketService().emitContractDriverVisibilityChanged(contractId, driverUserId, isLocationVisible);
      } catch { }

      return { success: true, participant: updated };
    });
  }
}


