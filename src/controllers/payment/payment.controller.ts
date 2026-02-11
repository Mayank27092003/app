import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { StripeService } from "../../services/stripe/stripe.service";
import { StripeAccount } from "../../models/stripeAccount";
import { Wallet } from "../../models/wallet";
import { WalletTransaction } from "../../models/walletTransaction";
import { UserBankAccount } from "../../models/userBankAccount";
import { UserPaymentMethod } from "../../models/userPaymentMethod";
import { ContractCompletionService } from "../../services/contract/completion.service";
import { HttpException } from "../../utils/httpException";

export class PaymentController {
  private completionService = new ContractCompletionService();

  /**
   * Get wallet balance
   */
  getWalletBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const wallet = await StripeService.getWalletBalance(userId);
      
      res.json({
        success: true,
        data: wallet || {
          availableBalance: 0,
          onHold: 0,
        },
      });
    } catch (error: any) {
      console.error("Error getting wallet balance:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get wallet balance" 
      });
    }
  };

  /**
   * Get wallet transactions
   */
  getWalletTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await StripeService.getWalletTransactions(
        userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      console.error("Error getting wallet transactions:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get wallet transactions" 
      });
    }
  };

  /**
   * Create payment intent for adding funds
   */
  createPaymentIntent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { amount, currency = "usd" } = req.body;

      if (!amount || amount <= 0) {
        throw new HttpException("Invalid amount", 400);
      }

      const paymentIntent = await StripeService.createPaymentIntent(
        userId,
        amount,
        currency
      );

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to create payment intent" 
      });
    }
  };

  /**
   * Confirm payment and add funds to wallet
   */
  confirmPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        throw new HttpException("Payment intent ID is required", 400);
      }

      const result = await StripeService.confirmPaymentAndAddFunds(
        paymentIntentId,
        userId
      );

      res.json({
        success: result.success,
        data: result.transaction,
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to confirm payment" 
      });
    }
  };

  /**
   * Get user's bank accounts
   */
  getBankAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const bankAccounts = await StripeService.getUserBankAccounts(userId);

      res.json({
        success: true,
        data: bankAccounts,
      });
    } catch (error: any) {
      console.error("Error getting bank accounts:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get bank accounts" 
      });
    }
  };

  /**
   * Add bank account
   */
  addBankAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const {
        accountNumber,
        accountHolderName,
        accountType,
        bankName,
        country,
        routingNumber,
      } = req.body;

      if (!accountNumber || !accountHolderName || !accountType || !bankName || !country) {
        throw new HttpException("All required bank account fields are required", 400);
      }

      // Validate routing number for countries that require it
      if (country.toUpperCase() === "US" && !routingNumber) {
        throw new HttpException("Routing number is required for US bank accounts", 400);
      }

      if (country.toUpperCase() === "IN" && !routingNumber) {
        throw new HttpException("IFSC code is required for Indian bank accounts", 400);
      }

      if (country.toUpperCase() === "GB" && !routingNumber) {
        throw new HttpException("Sort code is required for UK bank accounts", 400);
      }

      if (country.toUpperCase() === "AU" && !routingNumber) {
        throw new HttpException("BSB is required for Australian bank accounts", 400);
      }

      if (country.toUpperCase() === "CA" && !routingNumber) {
        throw new HttpException("Transit number is required for Canadian bank accounts", 400);
      }

      const result = await StripeService.createBankAccount(
        userId,
        accountNumber,
        accountHolderName,
        accountType,
        bankName,
        country,
        routingNumber
      );

      res.json({
        success: true,
        data: result.bankAccount,
        transferMethod: result.transferMethod,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error adding bank account:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to add bank account" 
      });
    }
  };

  /**
   * Verify bank account with micro-deposits
   */
  verifyBankAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { bankAccountId, amounts } = req.body;

      if (!bankAccountId || !amounts || amounts.length !== 2) {
        throw new HttpException("Bank account ID and amounts are required", 400);
      }

      const success = await StripeService.verifyBankAccount(
        bankAccountId,
        amounts
      );

      res.json({
        success,
        message: success ? "Bank account verified successfully" : "Verification failed",
      });
    } catch (error: any) {
      console.error("Error verifying bank account:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to verify bank account" 
      });
    }
  };

  /**
   * Delete bank account
   */
  deleteBankAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { bankAccountId } = req.params;

      if (!bankAccountId) {
        throw new HttpException("Bank account ID is required", 400);
      }

      const success = await StripeService.deleteBankAccount(userId, bankAccountId);

      res.json({
        success,
        message: success ? "Bank account deleted successfully" : "Failed to delete bank account",
      });
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to delete bank account" 
      });
    }
  };

  /**
   * Create withdrawal request
   */
  createWithdrawal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { amount } = req.body;

      const result = await StripeService.createWithdrawal(
        userId,
        amount,
        "usd"
      );

      res.json({
        success: result.success,
        data: result.payout,
        message: result.success ? "Withdrawal request created successfully" : "Failed to create withdrawal",
      });
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to create withdrawal" 
      });
    }
  };

  /**
   * Get user's payment methods
   */
  getPaymentMethods = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const paymentMethods = await StripeService.getUserPaymentMethods(userId);

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error: any) {
      console.error("Error getting payment methods:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get payment methods" 
      });
    }
  };

  /**
   * Handle Stripe webhooks
   * Note: This endpoint uses raw body middleware for signature verification
   */
  handleWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      
      // req.body is already a Buffer when using express.raw()
      const payload = req.body instanceof Buffer 
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);

      if (!sig) {
        throw new Error("Missing stripe-signature header");
      }

      await StripeService.handleWebhook(payload, sig);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(400).json({ 
        success: false, 
        message: error?.message || "Webhook handling failed" 
      });
    }
  };

  /**
   * Get or create user's Stripe Connect account and list bank accounts
   */
  manageConnectedBankAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);

      let _connect;
      try {
        _connect = await StripeService.getOrCreateConnectAccount(Number(userId));
      } catch {
         res.status(404).json({ error: "User does not have a connected Stripe account." });
         return;
      }

      const { account, dbRecord } = _connect;
      const externalAccounts = await StripeService.listConnectedAccountBankAccounts(account.id);
      let onboardingUrl: string | undefined;
      if (!account.details_submitted || !account.payouts_enabled) {
        const link = await StripeService.createAccountLink(account.id);
        onboardingUrl = link.url;
      }
      res.json({
        success: true,
        data: {
          accountId: account.id,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
          bankAccounts: externalAccounts,
          onboardingUrl,
        },
      });
    } catch (error: any) {
      console.error("Error managing connected bank accounts:", error);
      res.status(error?.status || 500).json({ success: false, message: error?.message || "Failed to manage connected bank accounts" });
    }
  };

  /**
   * List external bank accounts for a provided connected account ID
   */
  listConnectedBankAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.query.userId as string) || req.body?.userId || req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);

      let connectAccountId;
      try {
        const { account } = await StripeService.getOrCreateConnectAccount(Number(userId));
        connectAccountId = account.id;
      } catch {
        res.status(404).json({ error: "User does not have a connected Stripe account." });
        return;
      }
      const externalAccounts = await StripeService.listConnectedAccountBankAccounts(connectAccountId);
      res.json({ success: true, accountId: connectAccountId, data: externalAccounts });
    } catch (error: any) {
      console.error("Error listing connected bank accounts:", error);
      res.status(error?.status || 500).json({ success: false, message: error?.message || "Failed to list connected bank accounts" });
    }
  };

  /**
   * Generate a fresh Stripe Connect onboarding/update link (never cached)
   * Optional query: type=account_onboarding|account_update (default: account_onboarding)
   */
  generateConnectAccountLink = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.body?.userId as string) || req.query.userId || req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);

      let connect;
      try {
        connect = await StripeService.getOrCreateConnectAccount(Number(userId));
      } catch {
        res.status(404).json({ error: "User does not have a connected Stripe account." });
        return;
      }
      const { account } = connect;
      const { refreshUrl, returnUrl, type } = (req.body || {}) as any;
      const link = await StripeService.createAccountLink(account.id, {
        refreshUrl,
        returnUrl,
        type,
      });
      res.json({
        success: true,
        data: {
          accountId: account.id,
          url: link.url,
          created: Date.now(),
        },
      });
    } catch (error: any) {
      console.error("Error creating account link:", error);
      res.status(error?.status || 500).json({ success: false, message: error?.message || "Failed to create account link" });
    }
  };

  /**
   * Admin: Get all verified bank accounts
   */
  getAllVerifiedBankAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const bankAccounts = await StripeService.getAllVerifiedBankAccounts(limit, offset);

      res.json({
        success: true,
        data: bankAccounts,
      });
    } catch (error: any) {
      console.error("Error getting verified bank accounts:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get verified bank accounts" 
      });
    }
  };

  /**
   * Admin: Transfer money to verified bank account
   */
  adminTransferToBankAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        throw new HttpException("Unauthorized", 401);
      }

      const { userId, amount, bankAccountId, description } = req.body;

      if (amount <= 0) {
        throw new HttpException("Amount must be positive", 400);
      }

      const result = await StripeService.adminTransferToBankAccount(
        userId,
        amount,
        "usd",
        description,
      );

      res.json({
        success: result.success,
        data: result.transfer,
        message: result.message || (result.success ? "Transfer completed successfully" : "Transfer failed"),
      });
    } catch (error: any) {
      console.error("Error creating admin transfer:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to create admin transfer" 
      });
    }
  };

  /**
   * Get supported countries for bank account transfers
   */
  getSupportedCountries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const supportedCountries = StripeService.getSupportedCountriesForTransfers();

      res.json({
        success: true,
        data: {
          supportedCountries,
          message: "Countries that support bank account transfers via Stripe ACH"
        },
      });
    } catch (error: any) {
      console.error("Error getting supported countries:", error);
      res.status(error?.status || 500).json({ 
        success: false, 
        message: error?.message || "Failed to get supported countries" 
      });
    }
  };

  /**
   * Create payout to user's connected Stripe account bank (Connect)
   */
  createConnectPayout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const { amount, currency } = req.body;
      if (!amount || amount <= 0) throw new HttpException("Invalid amount", 400);
      if (!currency) throw new HttpException("Currency is required", 400);

      // 1. Get user's Connect account
      const stripeAccount = await StripeAccount.query().where({ userId, isActive: true }).first();
      if (!stripeAccount) throw new HttpException("No Stripe Connect account for user", 400);
      // 2. Wallet checks and transaction
      const trx = await require("../../database/db").default.transaction();
      try {
        const Wallet = require("../../models/wallet").Wallet;
        const WalletTransaction = require("../../models/walletTransaction").WalletTransaction;
        let wallet = await Wallet.query(trx).where("userId", userId).first();
        if (!wallet || wallet.availableBalance < amount) throw new HttpException("Insufficient balance", 400);
        // Deduct and create 'processing' payout row
        await wallet.$query(trx).patch({ availableBalance: wallet.availableBalance - amount });
        const tx = await WalletTransaction.query(trx).insert({
          walletId: wallet.id,
          type: "withdrawal",
          amount,
          status: "processing",
          description: `Payout to user's bank via Stripe Connect`});
        // 3. Create payout with Stripe Connect
        let payout;
        try {
          payout = await require('stripe')(process.env.STRIPE_SECRET_KEY).payouts.create({
            amount: Math.round(amount*100)/100 === amount ? amount : Math.round(amount * 100), // Stripe expects minor units
            currency,
            statement_descriptor: 'Wallet Payout',
          }, { stripeAccount: stripeAccount.stripeAccountId });
          // update tx on success
          await tx.$query(trx).patch({
            status: payout.status === 'paid' ? 'processed' : 'processing',
            referenceId: payout.id,
            referenceType: 'stripe_payout',
          });
          await trx.commit();
          res.json({ success: true, payout, message: 'Payout created', transactionId: tx.id });
        } catch (err) {
          await tx.$query(trx).patch({ status: "failed", description: `Stripe payout error: ${(err as any).message}` });
          await wallet.$query(trx).patch({ availableBalance: wallet.availableBalance + amount });
          await trx.commit();
          throw err;
        }
      } catch (dbErr) {
        await trx.rollback();
        throw dbErr;
      }
    } catch (error: any) {
      res.status(error?.status || 500).json({ success: false, message: error?.message || 'Failed to create payout' });
    }
  };

  /**
   * Transfer pending contract payouts when user connects Stripe account
   */
  transferPendingPayouts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const result = await this.completionService.transferPendingPayoutsForUser(userId);

      res.json({
        success: true,
        data: {
          transferred: result.transferred,
          failed: result.failed,
          payouts: result.payouts,
        },
        message: `Transferred ${result.transferred} payout(s), ${result.failed} failed`,
      });
    } catch (error: any) {
      console.error("Error transferring pending payouts:", error);
      res.status(error?.status || 500).json({
        success: false,
        message: error?.message || "Failed to transfer pending payouts",
      });
    }
  };

  /**
   * Admin: Get all transactions (Stripe payments + Wallet transactions)
   */
  getAllTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const transactionType = (req.query.transactionType as "stripe" | "wallet" | "all") || "all";
      const status = req.query.status as string | undefined;

      const result = await StripeService.getAllTransactions({
        limit,
        offset,
        userId,
        startDate,
        endDate,
        transactionType,
        status,
      });

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("Error getting all transactions:", error);
      res.status(error?.status || 500).json({
        success: false,
        message: error?.message || "Failed to get all transactions",
      });
    }
  };

  /**
   * Admin: Get payment statistics
   */
  getPaymentStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await StripeService.getPaymentStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error getting payment stats:", error);
      res.status(error?.status || 500).json({
        success: false,
        message: error?.message || "Failed to get payment statistics",
      });
    }
  };

}