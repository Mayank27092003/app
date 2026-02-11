import db from "../../database/db";
import { Contract } from "../../models/contracts";
import { SubContract } from "../../models/subContract";
import { Job } from "../../models/job";
import { ContractPayout } from "../../models/contractPayout";
import { Wallet } from "../../models/wallet";
import { WalletTransaction } from "../../models/walletTransaction";
import { StripeAccount } from "../../models/stripeAccount";
import { StripeService } from "../stripe/stripe.service";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import Stripe from "stripe";
import { Escrow } from "../../models";

export class ContractCompletionService {
  /**
   * Check if user is the root contract owner (shipper/main owner)
   * Root contract = contract without parentContractId
   */
  private async isRootContractOwner(
    contractId: number,
    userId: number
  ): Promise<boolean> {
    const contract = await Contract.query()
      .findById(contractId)
      .withGraphFetched("job.company");

    if (!contract) {
      throw new HttpException("Contract not found", 404);
    }

    // If contract has parentContractId, it's not root - reject
    if (contract.parentContractId) {
      return false;
    }

    // This is root contract - check if user is owner
    const job = contract.job;
    if (!job) {
      throw new HttpException("Job not found for contract", 404);
    }

    // Check if user is the owner (via company or direct userId)
    const isOwner =
      job.userId === userId ||
      (job.companyId ? job.company?.userId === userId : false);

    return !!isOwner;
  }

  /**
   * Get all child contracts recursively (broker resharing chain)
   */
  private async getAllChildContracts(
    rootContractId: number
  ): Promise<Contract[]> {
    const allChildContracts: Contract[] = [];
    let currentLevel: Contract[] = await Contract.query().where({
      parentContractId: rootContractId,
    });

    while (currentLevel.length > 0) {
      allChildContracts.push(...currentLevel);
      const childIds = currentLevel.map((c) => c.id);
      currentLevel = await Contract.query().whereIn(
        "parentContractId",
        childIds
      );
    }

    return allChildContracts;
  }

  /**
   * Calculate main earning after deducting sub-contract charges
   * Includes all sub-contracts from root and all child contracts
   */
  private async calculateMainEarning(
    rootContractId: number
  ): Promise<{
    mainEarning: number;
    subContractCharges: number;
    totalAmount: number;
  }> {
    const rootContract = await Contract.query().findById(rootContractId);
    if (!rootContract) {
      throw new HttpException("Root contract not found", 404);
    }

    const totalAmount = Number(rootContract.amount) || 0;

    // Get all child contracts (broker resharing chain)
    const childContracts = await this.getAllChildContracts(rootContractId);
    const allContractIds = [rootContractId, ...childContracts.map((c) => c.id)];

    // Get all sub-contracts for root and all child contracts
    const allSubContracts = await SubContract.query().whereIn(
      "rootContractId",
      allContractIds
    );

    // Calculate total sub-contract charges
    let subContractCharges = 0;
    for (const subContract of allSubContracts) {
      subContractCharges += Number(subContract.splitAmount) || 0;
    }

    // Main earning = total amount - sub-contract charges
    const mainEarning = totalAmount - subContractCharges;

    return {
      mainEarning: Math.max(0, mainEarning), // Ensure non-negative
      subContractCharges,
      totalAmount,
    };
  }

  /**
   * Create payout for a user and transfer if Stripe account is connected
   */
  private async createPayout(
    trx: any,
    contractId: number,
    userId: number,
    amount: number,
    type: "payout" | "refund" = "payout"
  ): Promise<ContractPayout> {
    // Create payout record
    const payout = await ContractPayout.query(trx).insert({
      contractId,
      userId,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Check if user has active Stripe account with payouts enabled
    const stripeAccount = await StripeAccount.query(trx)
      .where({ userId, isActive: true, payoutsEnabled: true })
      .orderBy("id", "desc")
      .first();

    // If user has Stripe account, transfer immediately
    if (stripeAccount) {
      try {
        await this.transferPayoutToStripe(payout, stripeAccount, trx);
      } catch (error: any) {
        Logger.error(
          `Failed to transfer payout ${payout.id} immediately: ${error.message}`
        );
        // Continue - payout remains pending, can be transferred later
      }
    }

    return payout;
  }

  /**
   * Transfer payout to user's Stripe Connect account
   * Wallet transaction created with "processing" status, updated via webhook when credited
   */
  private async transferPayoutToStripe(
    payout: ContractPayout,
    stripeAccount: StripeAccount,
    trx: any
  ): Promise<void> {
    // Update payout status to transferring
    await payout.$query(trx).patch({
      status: "transferring",
      updatedAt: new Date().toISOString(),
    });

    // Create Stripe transfer using StripeService
    const transfer = await StripeService.transferContractPayout(
      stripeAccount.stripeAccountId,
      payout.amount,
      payout.contractId,
      payout.id,
      payout.userId
    );

    // Update payout with Stripe transfer ID
    await payout.$query(trx).patch({
      stripeTransferId: transfer.id || null,
      status: "transferred",
      updatedAt: new Date().toISOString(),
    });

    // Create wallet transaction with "processing" status
    // Will be updated to "processed" via webhook when transfer is credited
    const wallet = await Wallet.query(trx)
      .where("userId", payout.userId)
      .first();

    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallet = await Wallet.query(trx).insert({
        userId: payout.userId,
        availableBalance: 0,
        onHold: 0,
      });
      const walletTransaction = await WalletTransaction.query(trx).insert({
        walletId: newWallet.id,
        type: "credit",
        amount: payout.amount,
        status: "processing", // Will be updated via webhook
        description: `Contract payout for contract ${payout.contractId}`,
        referenceId: transfer.id || payout.id.toString(),
        referenceType: "contract_payout",
      });

      // Link wallet transaction to payout
      await payout.$query(trx).patch({
        walletTransactionId: walletTransaction.id,
      });
    } else {
      const walletTransaction = await WalletTransaction.query(trx).insert({
        walletId: wallet.id,
        type: "credit",
        amount: payout.amount,
        status: "processing", // Will be updated via webhook when credited
        description: `Contract payout for contract ${payout.contractId}`,
        referenceId: transfer.id || payout.id.toString(),
        referenceType: "contract_payout",
      });

      // Link wallet transaction to payout
      await payout.$query(trx).patch({
        walletTransactionId: walletTransaction.id,
      });
    }

    Logger.info(
      `Payout ${payout.id} transfer initiated for user ${payout.userId}, waiting for webhook confirmation`
    );
  }

  /**
   * Complete contract - only root user can complete
   */
  async completeContract(
    contractId: number,
    userId: number
  ): Promise<{
    contract: Contract;
    payouts: ContractPayout[];
    mainEarning: number;
  }> {
    const trx = await db.transaction();
    try {
      // ✅ Step 1: Validate root contract & ownership
      const rootContract = await Contract.query(trx)
        .findById(contractId)
        .withGraphFetched("[job.[company,escrow]]");
  
      if (!rootContract) throw new HttpException("Contract not found", 404);
  
      // Root ownership: hiredUserId (the one who actually owns the root contract)
      if (rootContract.hiredByUserId !== userId) {
        throw new HttpException("Only root contract owner can complete contracts", 403);
      }
  
      if (rootContract.status === "completed") {
        throw new HttpException("Contract already completed", 400);
      }
      if(!rootContract.job?.escrow){
        throw new HttpException("No escrow found for contract", 400);
      }
      if (rootContract.status !== "active" || rootContract.job?.escrow?.status !== "held") {
        throw new HttpException("Contract not ready for completion", 400);
      }
  
      // ✅ Step 2: Fetch full hierarchy
      const childContracts = await this.getAllChildContracts(rootContract.id);
      const allContracts = [rootContract, ...childContracts];
      const allContractIds = allContracts.map(c => c.id);
  
      // ✅ Step 3: Mark contracts completed
      const now = new Date().toISOString();
      await Contract.query(trx).whereIn("id", allContractIds).patch({
        status: "completed",
        endDate: now,
        updatedAt: now,
      });
  
      // ✅ Step 4: Calculate payouts
      const payouts: ContractPayout[] = [];
      let totalPaidOut = 0;
  
      for (const contract of allContracts) {
        const { netEarning } = await contract.computeNetEarnings();
  
        const recipientId = contract.hiredUserId; // who gets the payment
        if (netEarning > 0 && recipientId) {
          totalPaidOut += netEarning;
  
          const payout = await this.createPayout(trx, contract.id, recipientId, netEarning);
          payouts.push(payout);
        }
      }
  
      // ✅ Step 5: Handle root refund if escrow > total contract amount
      const escrow = rootContract.job?.escrow;
      let refundAmount = 0;
  
      if (escrow && escrow.amount > rootContract.amount) {
        refundAmount = escrow.amount - rootContract.amount;
  
        if (refundAmount > 0) {
          const refund = await this.createPayout(
            trx,
            rootContract.id,
            rootContract.hiredByUserId, // refund to owner
            refundAmount,
            "refund"
          );
          payouts.push(refund);
        }
      }
  
      // ✅ Step 6: Mark escrow released
      if (escrow) {
        await Escrow.query(trx)
          .patch({ status: "released"})
          .where("id", escrow.id);
      }

      // ✅ Step 7: Mark job as completed
      if (rootContract.jobId) {
        await Job.query(trx)
          .patch({
            status: "completed",
            updatedAt: now,
          })
          .where("id", rootContract.jobId);
      }

      // ✅ Step 8: Commit & return
      await trx.commit();

  
      const updatedContract = await Contract.query().findById(contractId);
      const mainEarning = payouts
        .filter(p => p.userId === rootContract.hiredUserId)
        .reduce((sum, p) => sum + p.amount, 0);
  
      return {
        contract: updatedContract!,
        payouts,
        mainEarning,
      };
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error completing contract ${contractId}: ${error.message}`);
      throw error;
    }
  }
  
  

  /**
   * Transfer pending payouts for a user when they connect Stripe account
   */
  async transferPendingPayoutsForUser(userId: number): Promise<{
    transferred: number;
    failed: number;
    payouts: ContractPayout[];
  }> {
    const trx = await db.transaction();
    try {
      // Get user's Stripe account
      const stripeAccount = await StripeAccount.query(trx)
        .where({ userId, isActive: true, payoutsEnabled: true })
        .orderBy("id", "desc")
        .first();

      if (!stripeAccount) {
        throw new HttpException(
          "User does not have an active Stripe account with payouts enabled",
          400
        );
      }

      // Get all pending payouts for this user
      const pendingPayouts = await ContractPayout.query(trx)
        .where({ userId, status: "pending" })
        .withGraphFetched("contract");

      let transferred = 0;
      let failed = 0;
      const processedPayouts: ContractPayout[] = [];

      for (const payout of pendingPayouts) {
        try {
          await this.transferPayoutToStripe(payout, stripeAccount, trx);
          transferred++;
          const updated = await ContractPayout.query(trx).findById(payout.id);
          if (updated) processedPayouts.push(updated);
        } catch (error: any) {
          Logger.error(
            `Failed to transfer payout ${payout.id}: ${error.message}`
          );
          failed++;
          const updated = await ContractPayout.query(trx).findById(payout.id);
          if (updated) processedPayouts.push(updated);
        }
      }

      await trx.commit();

      return {
        transferred,
        failed,
        payouts: processedPayouts,
      };
    } catch (error: any) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Update payout status from Stripe webhook
   */
  async updatePayoutFromWebhook(
    stripeTransferId: string,
    status: "succeeded" | "failed",
    errorMessage?: string
  ): Promise<ContractPayout | null> {
    const payout = await ContractPayout.query()
      .where("stripeTransferId", stripeTransferId)
      .first();

    if (!payout) {
      Logger.warn(
        `Payout not found for Stripe transfer ${stripeTransferId}`
      );
      return null;
    }

    const trx = await db.transaction();
    try {
      if (status === "succeeded") {
        // If already transferred, skip
        if (payout.status === "transferred") {
          await trx.rollback();
          return payout;
        }

        await payout.$query(trx).patch({
          status: "transferred",
          transferredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update wallet transaction status to processed and credit wallet
        const walletTransaction = payout.walletTransactionId
          ? await WalletTransaction.query(trx).findById(payout.walletTransactionId)
          : null;

        if (walletTransaction && walletTransaction.status === "processing") {
          await walletTransaction.$query(trx).patch({
            status: "processed",
          });

          // Credit wallet balance
          const wallet = await Wallet.query(trx).findById(walletTransaction.walletId);
          if (wallet) {
            await wallet.$query(trx).patch({
              availableBalance: wallet.availableBalance + payout.amount,
            });
          }
        } else if (!walletTransaction) {
          // Create wallet transaction if doesn't exist
          const wallet = await Wallet.query(trx)
            .where("userId", payout.userId)
            .first();

          if (wallet) {
            const newWalletTransaction = await WalletTransaction.query(trx).insert({
              walletId: wallet.id,
              type: "credit",
              amount: payout.amount,
              status: "processed",
              description: `Contract payout for contract ${payout.contractId}`,
              referenceId: stripeTransferId,
              referenceType: "contract_payout",
            });

            await wallet.$query(trx).patch({
              availableBalance: wallet.availableBalance + payout.amount,
            });

            await payout.$query(trx).patch({
              walletTransactionId: newWalletTransaction.id,
            });
          }
        }
      } else if (status === "failed") {
        await payout.$query(trx).patch({
          status: "failed",
          errorMessage: errorMessage || "Transfer failed",
          updatedAt: new Date().toISOString(),
        });
      }

      await trx.commit();
      const updated = await ContractPayout.query().findById(payout.id);
      return updated || null;
    } catch (error: any) {
      await trx.rollback();
      Logger.error(
        `Error updating payout from webhook: ${error.message}`
      );
      throw error;
    }
  }
}

