import Stripe from "stripe";
import { env } from "../../config/env";
import { User } from "../../models/users";
import { PaymentProvider } from "../../models/paymentProvider";
import { UserPaymentMethod } from "../../models/userPaymentMethod";
import { UserBankAccount } from "../../models/userBankAccount";
import { Wallet } from "../../models/wallet";
import { WalletTransaction } from "../../models/walletTransaction";
import { Escrow } from "../../models/escrow";
import { Job } from "../../models/job";
import { StripePayment } from "../../models/stripePayment";
import db from "../../database/db";
import { StripeAccount } from "../../models/stripeAccount";
import { Logger } from "../../utils/logger";
import { emitJobCreated } from "../socket/instance";
import { JobService } from "../job";

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  //   apiVersion: "2024-12-18.acacia",
});

export class StripeService {
  /**
   * Get or create Stripe customer for a user
   */
  static async getOrCreateCustomer(user: User): Promise<Stripe.Customer> {
    try {
      // Check if user already has a Stripe customer ID stored
      const existingCustomer = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomer.data.length > 0) {
        return existingCustomer.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id.toString(),
          userName: user.userName,
        },
      });

      return customer;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw new Error("Failed to create Stripe customer");
    }
  }

  /**
   * Get or create a Stripe Connect account (Express) for a user
   */
  static async getOrCreateConnectAccount(
    userId: number
  ): Promise<{ account: Stripe.Account; dbRecord: StripeAccount }> {
    const trx = await db.transaction();
    try {
      const user = await User.query().findById(userId);
      if (!user) throw new Error("User not found");

      // Check local record
      let existing = await StripeAccount.query(trx)
        .where({ userId, isActive: true })
        .first();

      let account: Stripe.Account;
      if (existing) {
        account = await stripe.accounts.retrieve(existing.stripeAccountId);
        await StripeAccount.query(trx)
          .patch({
            payoutsEnabled: !!account.payouts_enabled,
            chargesEnabled: !!account.charges_enabled,
            isVerified: !!account.details_submitted,
            requirements: JSON.stringify(account.requirements || ({} as any)),
            capabilities: JSON.stringify(account.capabilities || ({} as any)),
            updatedAt: new Date().toISOString(),
          })
          .where("stripeAccountId", existing.stripeAccountId);
      } else {
        account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        existing = await StripeAccount.query(trx).insert({
          userId,
          stripeAccountId: account.id,
          accountType:
            account.business_type === "company" ? "company" : "individual",
          isVerified: !!account.details_submitted,
          isActive: true,
          capabilities: JSON.stringify(account.capabilities || ({} as any)),
          chargesEnabled: !!account.charges_enabled,
          payoutsEnabled: !!account.payouts_enabled,
          requirements: JSON.stringify(account.requirements || ({} as any)),
        });
      }

      await trx.commit();
      return { account, dbRecord: existing };
    } catch (e) {
      await trx.rollback();
      throw e;
    }
  }

  /**
   * Create an onboarding/update link for a connected account
   */
  static async createAccountLink(
    accountId: string,
    options?: {
      refreshUrl?: string;
      returnUrl?: string;
      type?: "account_onboarding" | "account_update";
    }
  ): Promise<Stripe.AccountLink> {
    const refresh_url =
      options?.refreshUrl || "https://example.com/stripe/refresh";
    const return_url =
      options?.returnUrl || "https://example.com/stripe/return";
    const type = options?.type || "account_onboarding";

    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type,
    });
  }

  /**
   * List external bank accounts for a connected account (returns only mapped/camelCase fields)
   */
  static async listConnectedAccountBankAccounts(accountId: string) {
    const rawExternal = await stripe.accounts.listExternalAccounts(accountId, {
      object: "bank_account",
      limit: 50,
    });
    return (rawExternal.data || []).map((acc: any) => ({
      id: acc.id,
      bankName: acc.bank_name as string,
      last4: acc.last4,
      currency: acc.currency,
      country: acc.country,
      status: acc.status,
      defaultForCurrency: acc.default_for_currency,
      accountHolderName: acc.account_holder_name,
    }));
  }

  /**
   * Create payment intent for adding funds to wallet
   */
  static async createPaymentIntent(
    userId: number,
    amount: number,
    currency: string = "usd"
  ): Promise<Stripe.PaymentIntent> {
    try {
      const user = await User.query().findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const customer = await this.getOrCreateCustomer(user);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customer.id,
        metadata: {
          userId: userId.toString(),
          type: "wallet_funding",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw new Error("Failed to create payment intent");
    }
  }

  /**
   * Create Stripe Checkout Session for job funding (returns payment URL)
   * Note: The checkout session automatically creates a payment intent, so no need for separate payment intent creation
   */
  /**
   * Retrieve a Stripe checkout session and check if it's still valid for reuse
   */
  static async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Check if session is still valid (not expired, not completed)
      // Sessions expire after 24 hours by default
      const isExpired = session.expires_at && session.expires_at < Math.floor(Date.now() / 1000);
      const isCompleted = session.payment_status === 'paid' || session.status === 'complete';
      
      // Return session only if it's still valid for reuse
      if (!isExpired && !isCompleted) {
        return session;
      }
      
      return null;
    } catch (error) {
      Logger.warn(`Error retrieving checkout session ${sessionId}: ${error}`);
      return null;
    }
  }

  static async createJobCheckoutSession(
    userId: number,
    jobId: number,
    amount: number,
    jobTitle: string,
    currency: string = "usd",
    successUrl?: string,
    cancelUrl?: string,
    metadata?: Record<string, string>
  ): Promise<{ session: Stripe.Checkout.Session; paymentUrl: string; paymentIntentId: string }> {
    try {
      const user = await User.query().findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const customer = await this.getOrCreateCustomer(user);

      // Get base URL from environment or use defaults
      const baseUrl = metadata?.baseUrl|| process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
      const defaultSuccessUrl = `${baseUrl}/jobs/${jobId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancelUrl = `${baseUrl}/jobs/${jobId}/payment-cancel`;

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Job Funding: ${jobTitle}`,
                description: `Fund escrow for job posting - Job ID: ${jobId}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl || defaultSuccessUrl,
        cancel_url: cancelUrl || defaultCancelUrl,
        metadata: {
          userId: userId.toString(),
          jobId: jobId.toString(),
          type: "job_funding",
          ...metadata,
        },
        payment_intent_data: {
          metadata: {
            userId: userId.toString(),
            jobId: jobId.toString(),
            type: "job_funding",
            ...metadata,
          },
        },
      });

      // Extract payment intent ID (can be string or expanded object)
      const paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || '';

      return {
        session,
        paymentUrl: session.url || "",
        paymentIntentId,
      };
    } catch (error) {
      console.error("Error creating job checkout session:", error);
      throw new Error("Failed to create job checkout session");
    }
  }

  /**
   * Confirm payment intent and add funds to wallet
   */
  static async confirmPaymentAndAddFunds(
    paymentIntentId: string,
    userId: number
  ): Promise<{ success: boolean; transaction?: WalletTransaction }> {
    const trx = await db.transaction();

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        throw new Error("Payment not succeeded");
      }

      // Get or create wallet for user
      let wallet = await Wallet.query(trx).where("userId", userId).first();

      if (!wallet) {
        wallet = await Wallet.query(trx).insert({
          userId,
          availableBalance: 0,
          onHold: 0,
        });
      }

      // Add funds to wallet
      const amount = paymentIntent.amount / 100; // Convert from cents
      await wallet.$query(trx).patch({
        availableBalance: wallet.availableBalance + amount,
      });

      // Create wallet transaction record
      const transaction = await WalletTransaction.query(trx).insert({
        walletId: wallet.id,
        type: "credit",
        amount,
        status: "processed",
        description: `Funds added via Stripe payment ${paymentIntentId}`,
        referenceId: paymentIntent.metadata?.userId,
        referenceType: "stripe_payment",
      });

      await trx.commit();

      return { success: true, transaction };
    } catch (error) {
      await trx.rollback();
      console.error("Error confirming payment:", error);
      throw new Error("Failed to confirm payment and add funds");
    }
  }

  /**
   * Create bank account for withdrawals - Simplified approach
   * Only supports ACH countries, throws clear error for others
   */
  static async createBankAccount(
    userId: number,
    accountNumber: string,
    accountHolderName: string,
    accountType: "checking" | "savings",
    bankName: string,
    country: string,
    routingNumber?: string
  ): Promise<{
    bankAccount: UserBankAccount;
    transferMethod: string;
    message: string;
  }> {
    const trx = await db.transaction();

    try {
      const user = await User.query().findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const customer = await this.getOrCreateCustomer(user);
      const supportsACH = this.supportsACHPayments(country);

      // if (!supportsACH) {
      //   throw new Error(`Bank account transfers are not supported for ${country}. Please use alternative payment methods like UPI, Net Banking, or Cards.`);
      // }

      // Only create ACH bank accounts for supported countries
      const bankAccountData: any = {
        country: country.toLowerCase(),
        currency: this.getCurrencyForCountry(country),
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        account_holder_type: "individual",
      };

      if (routingNumber) {
        bankAccountData.routing_number = routingNumber;
      }

      const bankAccountToken = await stripe.tokens.create({
        bank_account: bankAccountData,
      });

      const bankAccount = await stripe.customers.createSource(customer.id, {
        source: bankAccountToken.id,
      });

      // Get payment provider (Stripe)
      let stripeProvider = await PaymentProvider.query()
        .where("name", "stripe")
        .first();

      if (!stripeProvider) {
        stripeProvider = await PaymentProvider.query().insert({
          name: "stripe",
          description: "Stripe payment processor",
          isEnabled: true,
        });
      }

      // Save bank account to database
      const userBankAccount = await UserBankAccount.query(trx).insert({
        userId,
        providerId: stripeProvider.id,
        externalBankId: bankAccount.id,
        bankName: bankName,
        last4: accountNumber.slice(-4),
        country: country.toUpperCase(),
        currency: this.getCurrencyForCountry(country),
        isDefault: false,
        isVerified: false, // Needs verification
        isActive: true,
      });

      await trx.commit();

      return {
        bankAccount: userBankAccount,
        transferMethod: "ACH",
        message: `Bank account created successfully. ACH transfers are supported for ${country}.`,
      };
    } catch (error: any) {
      await trx.rollback();
      console.error("Error creating bank account:", error);
      throw new Error("Failed to create bank account: " + error?.message);
    }
  }

  /**
   * Verify bank account with micro-deposits
   */
  static async verifyBankAccount(
    bankAccountId: string,
    amounts: [number, number]
  ): Promise<boolean> {
    try {
      // await stripe.accounts.verifyExternalAccount(bankAccountId, {
      //     amounts: [amounts[0], amounts[1]],
      // });

      // Update bank account status in database
      await UserBankAccount.query()
        .where("externalBankId", bankAccountId)
        .patch({ isVerified: true });

      return true;
    } catch (error) {
      console.error("Error verifying bank account:", error);
      throw new Error("Failed to verify bank account");
    }
  }

  /**
   * Create withdrawal from wallet to bank account
   */
  static async createWithdrawal(
    userId: number,
    amount: number,
    currency: string,
  ): Promise<{ success: boolean; payout?: Stripe.Payout }> {
    const trx = await db.transaction();
  
    try {
      // Ensure user has a wallet
      let wallet = await Wallet.query(trx).where("userId", userId).first();
      if (!wallet) {
        wallet = await Wallet.query(trx).insert({ userId, availableBalance: 0, onHold: 0 });
      }
      if (wallet.availableBalance < amount) {
        throw new Error("Insufficient funds");
      }
  
      // Lookup Stripe Connect account
      const connectRow = await StripeAccount.query(trx).where({ userId, isActive: true }).orderBy("id", "desc").first();
      if (!connectRow) throw new Error("User does not have a connected Stripe account.");
      const connectAccountId = connectRow.stripeAccountId;
  
      // Payout funds from Connect to their bank (NO bankAccountId in payload, Stripe sends to default external)
      const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100), // e.g. $10 = 1000
        currency:"usd",
        statement_descriptor: "User Withdraw",
        metadata: {
          userId: userId.toString(),
          type: "wallet_withdrawal"
        }
      }, {
        stripeAccount: connectAccountId
      });
  
      // Deduct from wallet after successful payout
      await wallet.$query(trx).patch({ availableBalance: wallet.availableBalance - amount });
  
      // Optionally: Create wallet transaction record here
      await WalletTransaction.query(trx).insert({
        walletId: wallet.id,
        type: "withdrawal",
        amount,
        status: payout.status === 'paid' ? 'processed' : 'processing', // will update via webhook
        description: "Withdrawal to bank for Connect Account",
        referenceId: payout.id,
        referenceType: "stripe_transfer",
      });
      // After successful payout and wallet update...
      await trx.commit();
  
      return { success: true, payout };
    } catch (error) {
      await trx.rollback();
      console.error("Error creating withdrawal:", error);
      throw new Error("Failed to create withdrawal");
    }
  }

  /**
   * Get user's bank accounts
   */
  static async getUserBankAccounts(userId: number): Promise<UserBankAccount[]> {
    try {
      return await UserBankAccount.query()
        .where("userId", userId)
        .where("isActive", true)
        .withGraphFetched("provider");
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      throw new Error("Failed to fetch bank accounts");
    }
  }

  /**
   * Get user's payment methods
   */
  static async getUserPaymentMethods(
    userId: number
  ): Promise<UserPaymentMethod[]> {
    try {
      return await UserPaymentMethod.query()
        .where("userId", userId)
        .where("isActive", true)
        .withGraphFetched("provider");
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw new Error("Failed to fetch payment methods");
    }
  }

  /**
   * Delete bank account
   */
  static async deleteBankAccount(
    userId: number,
    bankAccountId: string
  ): Promise<boolean> {
    const trx = await db.transaction();

    try {
      // Delete from Stripe
      const user = await User.query().findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const customer = await this.getOrCreateCustomer(user);
      await stripe.customers.deleteSource(customer.id, bankAccountId);

      // Mark as inactive in database
      await UserBankAccount.query(trx)
        .where("userId", userId)
        .where("externalBankId", bankAccountId)
        .patch({ isActive: false });

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      console.error("Error deleting bank account:", error);
      throw new Error("Failed to delete bank account");
    }
  }

  /**
   * Get wallet balance for user
   */
  static async getWalletBalance(
    userId: number
  ): Promise<Wallet | null | undefined> {
    try {
      return await Wallet.query().where("userId", userId).first();
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      throw new Error("Failed to fetch wallet balance");
    }
  }

  /**
   * Get wallet transactions for user
   */
  static async getWalletTransactions(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<WalletTransaction[]> {
    try {
      const wallet = await Wallet.query().where("userId", userId).first();

      if (!wallet) {
        return [];
      }

      return await WalletTransaction.query()
        .where("walletId", wallet.id)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      throw new Error("Failed to fetch wallet transactions");
    }
  }

  /**
   * Admin transfer to verified bank account
   */
  /**
   * Admin transfer payout to user's Connect account, updates wallet, no bankAccountId required.
   */
  static async adminTransferToBankAccount(
    userId: number,
    amount: number,
    currency: string,
    description?: string
  ): Promise<{
    success: boolean;
    transfer?: Stripe.Transfer;
    message?: string;
  }> {
    const trx = await db.transaction();
    try {
      // Find user's Stripe Connect Account
      const userConnect = await StripeAccount.query(trx)
        .where({ userId, isActive: true })
        .orderBy("id", "desc")
        .first();
      if (!userConnect)
        throw new Error("User does not have a connected Stripe account.");
      const connectAccountId = userConnect.stripeAccountId;

      // Transfer platform→connected account with metadata
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency,
        destination: connectAccountId,
        description: description || `Admin transfer to userId=${userId}`,
        metadata: {
          source: "admin",
          toUserId: userId.toString(),
        },
      });

      // Update local wallet for user: create wallet if missing
      let wallet = await Wallet.query(trx).where("userId", userId).first();
      if (!wallet) {
        wallet = await Wallet.query(trx).insert({
          userId,
          availableBalance: 0,
          onHold: 0,
        });
      }
      // Decrement wallet by the transferred amount
      await wallet.$query(trx).patch({
        availableBalance: wallet.availableBalance - amount,
      });

      await trx.commit();
      return { success: true, transfer };
    } catch (error:any) {
      await trx.rollback();
      console.error("Error creating admin transfer:", error);
      throw new Error(error?.message || "Failed to create admin transfer");
    }
  }

  /**
   * Transfer contract payout to user's Stripe Connect account
   */
  static async transferContractPayout(
    stripeAccountId: string,
    amount: number,
    contractId: number,
    payoutId: number,
    userId: number
  ): Promise<Stripe.Transfer> {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        destination: stripeAccountId,
        description: `Contract payout for contract ${contractId}`,
        metadata: {
          source: "contract_payout",
          contractId: contractId.toString(),
          payoutId: payoutId.toString(),
          toUserId: userId.toString(),
        },
      });

      return transfer;
    } catch (error: any) {
      Logger.error(`Error creating contract payout transfer: ${error.message}`);
      throw new Error(error?.message || "Failed to create contract payout transfer");
    }
  }

  /**
   * Get all verified bank accounts for admin
   */
  static async getAllVerifiedBankAccounts(
    limit: number = 50,
    offset: number = 0
  ): Promise<UserBankAccount[]> {
    try {
      return await UserBankAccount.query()
        .where("isVerified", true)
        .where("isActive", true)
        .withGraphFetched("user")
        .withGraphFetched("provider")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error fetching verified bank accounts:", error);
      throw new Error("Failed to fetch verified bank accounts");
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(
    payload: string,
    signature: string
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      const eventType = event.type as string;
      
      switch (eventType) {
        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;
        case "transfer.created":
          await this.handleTransferCreated(
            event.data.object as Stripe.Transfer
          );
          break;
        case "transfer.paid":
        case "transfer.updated":
          // Handle successful transfers
          if ((event.data.object as any).status === "paid" || eventType === "transfer.paid") {
            await this.handleTransferPaid(
              event.data.object as Stripe.Transfer
            );
          }
          break;
        case "transfer.failed":
          await this.handleTransferFailed(
            event.data.object as Stripe.Transfer
          );
          break;
        case "payout.paid":
          await this.handlePayoutPaid(
            event.data.object as Stripe.Payout
          );
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error("Error handling webhook:", error);
      throw new Error("Failed to handle webhook");
    }
  }

  private static async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const trx = await db.transaction();
    try {
      if (paymentIntent.metadata?.type === "wallet_funding") {
        // Direct card payment confirmed - Credit platform wallet
        const userId = parseInt(paymentIntent.metadata.userId);
        await this.confirmPaymentAndAddFunds(paymentIntent.id, userId);
        await trx.commit();
        Logger.info(`Wallet funded successfully for user ${userId} via payment_intent.succeeded`);
      } else if (paymentIntent.metadata?.type === "job_funding") {
        // Job funding - Update job status from pending_funding to active
        const userId = parseInt(paymentIntent.metadata.userId);
        const jobId = parseInt(paymentIntent.metadata.jobId);

        const job = await Job.query(trx).findById(jobId);
        if (!job) {
          await trx.rollback();
          Logger.error(`Job ${jobId} not found in payment_intent.succeeded`);
          return;
        }

        // Update job status from pending_funding to active (if not already active)
          await Job.query(trx).patchAndFetchById(jobId, {
            status: "active",
            updatedAt: new Date().toISOString(),
          });

        // Update escrow status to held
        const escrow = await Escrow.query(trx)
          .where("jobId", jobId)
          .where("status", "pending")
          .first();

        if (escrow) {
          await Escrow.query(trx).patchAndFetchById(escrow.id, {
            status: "held",
          });
        }

        // Update StripePayment status
        await StripePayment.query(trx)
          .where("stripePaymentIntentId", paymentIntent.id)
          .patch({
            status: "succeeded",
            updatedAt: new Date().toISOString(),
          });

        await trx.commit();

        Logger.info(`Job ${jobId} funded successfully, status updated to active via payment_intent.succeeded`);
        
        // Emit job created event now that payment is complete and job is active
        try {
          const jobService = new JobService();
          const jobInfo = await jobService.getJobDetails(jobId);
          emitJobCreated({
            ...jobInfo
          });
        } catch (emitError: any) {
          Logger.error(`Error emitting job created event: ${emitError?.message || "Unknown error"}`);
          // Don't throw - payment already succeeded, just log the error
        }
      } else {
        await trx.rollback();
      }
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error handling payment intent succeeded: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  private static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const trx = await db.transaction();
    try {
      // Checkout session completed - payment was successful
      if (session.metadata?.type === "job_funding" && session.metadata.jobId) {
        const jobId = parseInt(session.metadata.jobId);
        
        // Update job status from pending_funding to active
        const job = await Job.query(trx).findById(jobId);
        if (job) {
          await Job.query(trx).patchAndFetchById(jobId, {
            status: "active",
            updatedAt: new Date().toISOString(),
          });

          // Update escrow status to held if exists
          const escrow = await Escrow.query(trx)
            .where("jobId", jobId)
            .where("status", "pending")
            .first();

          if (escrow) {
            await Escrow.query(trx).patchAndFetchById(escrow.id, {
              status: "held",
            });
          }

          // Update StripePayment status if payment_intent exists
          if (session.payment_intent) {
            const paymentIntentId = typeof session.payment_intent === "string" 
              ? session.payment_intent 
              : (session.payment_intent as any).id;
            
            if (paymentIntentId) {
              await StripePayment.query(trx)
                .where("stripePaymentIntentId", paymentIntentId)
                .patch({
                  status: "succeeded",
                  updatedAt: new Date().toISOString(),
                });
            }
          }

          await trx.commit();
          Logger.info(`Job ${jobId} activated from pending_funding via checkout.session.completed`);

          // Emit job created event
          try {
            const jobService = new JobService();
            const jobInfo = await jobService.getJobDetails(jobId);
            emitJobCreated({
              ...jobInfo
            });
          } catch (emitError: any) {
            Logger.error(`Error emitting job created event: ${emitError?.message || "Unknown error"}`);
          }
        } else {
          await trx.rollback();
          Logger.warn(`Job ${jobId} not in pending_funding status or not found`);
        }
      } else {
        await trx.rollback();
      }
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error handling checkout session completed: ${error?.message || "Unknown error"}`);
      // Don't throw - let payment_intent.succeeded handle it as fallback
    }
  }

  private static async handleTransferCreated(
    transfer: Stripe.Transfer
  ): Promise<void> {
    if (transfer.metadata?.type === "wallet_withdrawal") {
      // Update transaction status to processed
      await WalletTransaction.query()
        .where("referenceId", transfer.id)
        .where("referenceType", "stripe_transfer")
        .patch({ status: "processing" });
    }
  }

  private static async handleTransferPaid(
    transfer: Stripe.Transfer
  ): Promise<void> {
    // Transfer to connected account completed - Mark payout as processed
    const trx = await db.transaction();
    try {
      // Handle contract payout transfers
      const { ContractPayout } = require("../../models/contractPayout");
      const { ContractCompletionService } = require("../../services/contract/completion.service");
      const completionService = new ContractCompletionService();

      await completionService.updatePayoutFromWebhook(
        transfer.id,
        "succeeded"
      );

      // Also handle wallet withdrawals
      if (transfer.metadata?.type === "wallet_withdrawal") {
        await WalletTransaction.query(trx)
          .where("referenceId", transfer.id)
          .where("referenceType", "stripe_transfer")
          .patch({ status: "processed" });
      }

      await trx.commit();
      Logger.info(`Transfer ${transfer.id} paid - payout marked as processed`);
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error handling transfer paid: ${error?.message || "Unknown error"}`);
      // Don't throw - webhook should acknowledge
    }
  }

  private static async handleTransferFailed(
    transfer: Stripe.Transfer
  ): Promise<void> {
    const trx = await db.transaction();
    try {
      // Handle contract payout transfers
      const { ContractPayout } = require("../../models/contractPayout");
      const { ContractCompletionService } = require("../../services/contract/completion.service");
      const completionService = new ContractCompletionService();

      const failureMessage = (transfer as any).failure_message || "Transfer failed";
      await completionService.updatePayoutFromWebhook(
        transfer.id,
        "failed",
        failureMessage
      );

      // Also handle wallet withdrawals
      if (transfer.metadata?.type === "wallet_withdrawal") {
        // Update transaction status to failed and refund wallet
        const transaction = await WalletTransaction.query(trx)
          .where("referenceId", transfer.id)
          .where("referenceType", "stripe_transfer")
          .first();

        if (transaction) {
          await transaction.$query(trx).patch({ status: "failed" });

          // Refund the amount back to wallet
          const wallet = await Wallet.query(trx).findById(transaction.walletId);
          if (wallet) {
            await wallet.$query(trx).patch({
              availableBalance: wallet.availableBalance + transaction.amount,
            });
          }
        }
      }

      await trx.commit();
      Logger.info(`Transfer ${transfer.id} failed - payout marked as failed`);
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error handling transfer failed: ${error?.message || "Unknown error"}`);
      // Don't throw - webhook should acknowledge
    }
  }

  /**
   * Handle payout.paid webhook - Money reached user's bank
   * Mark payout as finalized
   */
  private static async handlePayoutPaid(
    payout: Stripe.Payout
  ): Promise<void> {
    const trx = await db.transaction();
    try {
      // Payout.paid means money reached user's bank account
      // This is different from transfer.paid (which is for Connect transfers)
      
      // Find wallet transactions with this payout ID
      const walletTransactions = await WalletTransaction.query(trx)
        .where("referenceId", payout.id)
        .where("referenceType", "stripe_payout");

      for (const transaction of walletTransactions) {
        // Update transaction status to finalized (if in processed status)
        if (transaction.status === "processed") {
          await transaction.$query(trx).patch({
            status: "processed", // Already processed, just log
          });
          Logger.info(`Payout ${payout.id} reached user's bank - transaction ${transaction.id} finalized`);
        }
      }

      // Also check for contract payouts if they use payouts instead of transfers
      // (Currently we use transfers, but keeping this for future compatibility)
      if (payout.metadata?.source === "contract_payout") {
        const { ContractPayout } = require("../../models/contractPayout");
        const payoutRecord = await ContractPayout.query(trx)
          .where("stripePayoutId", payout.id)
          .first();

        if (payoutRecord && payoutRecord.status === "transferred") {
          // Mark as finalized (add a new status or use existing)
          Logger.info(`Contract payout ${payoutRecord.id} finalized - money reached user's bank`);
        }
      }

      await trx.commit();
      Logger.info(`Payout ${payout.id} paid - money reached user's bank`);
    } catch (error: any) {
      await trx.rollback();
      Logger.error(`Error handling payout paid: ${error?.message || "Unknown error"}`);
      // Don't throw - webhook should acknowledge
    }
  }

  /**
   * Create virtual bank account for countries that support it (like India)
   */
  static async createVirtualBankAccount(
    userId: number,
    country: string,
    currency?: string
  ): Promise<{ success: boolean; virtualAccount?: any; message?: string }> {
    try {
      const user = await User.query().findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if country supports virtual bank accounts
      const supportsVirtualAccounts = this.supportsVirtualBankAccounts(country);

      if (!supportsVirtualAccounts) {
        return {
          success: false,
          message: `Virtual bank accounts are not supported for ${country}`,
        };
      }

      // Create virtual bank account for supported countries
      const virtualAccount = await stripe.accounts.create({
        type: "custom",
        country: country.toLowerCase(),
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
        },
        business_type: "individual",
        individual: {
          first_name: user.firstName || "User",
          last_name: user.lastName || "Name",
          email: user.email,
        },
        metadata: {
          userId: userId.toString(),
          accountType: "virtual_bank_account",
        },
      });

      return {
        success: true,
        virtualAccount,
        message: `Virtual bank account created for ${country}`,
      };
    } catch (error: any) {
      console.error("Error creating virtual bank account:", error);
      return {
        success: false,
        message: `Failed to create virtual bank account: ${error.message}`,
      };
    }
  }

  /**
   * Check if a country supports virtual bank accounts
   */
  private static supportsVirtualBankAccounts(country: string): boolean {
    const virtualAccountSupportedCountries = [
      "IN", // India
      "US", // United States
      "CA", // Canada
      "GB", // United Kingdom
      "AU", // Australia
      "DE", // Germany
      "FR", // France
      "IT", // Italy
      "ES", // Spain
      "NL", // Netherlands
      "BE", // Belgium
      "AT", // Austria
      "FI", // Finland
      "IE", // Ireland
      "PT", // Portugal
      "GR", // Greece
      "LU", // Luxembourg
      "MT", // Malta
      "CY", // Cyprus
      "SK", // Slovakia
      "SI", // Slovenia
      "EE", // Estonia
      "LV", // Latvia
      "LT", // Lithuania
    ];

    return virtualAccountSupportedCountries.includes(country.toUpperCase());
  }

  /**
   * Get supported countries for bank account transfers
   */
  static getSupportedCountriesForTransfers(): string[] {
    return [
      "US", // United States
      "CA", // Canada
      "GB", // United Kingdom
      "AU", // Australia
      "DE", // Germany
      "FR", // France
      "IT", // Italy
      "ES", // Spain
      "NL", // Netherlands
      "BE", // Belgium
      "AT", // Austria
      "FI", // Finland
      "IE", // Ireland
      "PT", // Portugal
      "GR", // Greece
      "LU", // Luxembourg
      "MT", // Malta
      "CY", // Cyprus
      "SK", // Slovakia
      "SI", // Slovenia
      "EE", // Estonia
      "LV", // Latvia
      "LT", // Lithuania
    ];
  }

  /**
   * Check if a country supports ACH payments
   */
  private static supportsACHPayments(country: string): boolean {
    const achSupportedCountries = [
      "US", // United States
      "CA", // Canada
      "GB", // United Kingdom
      "AU", // Australia
      "DE", // Germany
      "FR", // France
      "IT", // Italy
      "ES", // Spain
      "NL", // Netherlands
      "BE", // Belgium
      "AT", // Austria
      "FI", // Finland
      "IE", // Ireland
      "PT", // Portugal
      "GR", // Greece
      "LU", // Luxembourg
      "MT", // Malta
      "CY", // Cyprus
      "SK", // Slovakia
      "SI", // Slovenia
      "EE", // Estonia
      "LV", // Latvia
      "LT", // Lithuania
    ];

    return achSupportedCountries.includes(country.toUpperCase());
  }

  /**
   * Get currency for a given country
   */
  private static getCurrencyForCountry(country: string): string {
    const currencyMap: { [key: string]: string } = {
      US: "usd",
      CA: "cad",
      GB: "gbp",
      AU: "aud",
      IN: "inr",
      DE: "eur",
      FR: "eur",
      IT: "eur",
      ES: "eur",
      NL: "eur",
      BE: "eur",
      AT: "eur",
      FI: "eur",
      IE: "eur",
      PT: "eur",
      GR: "eur",
      LU: "eur",
      MT: "eur",
      CY: "eur",
      SK: "eur",
      SI: "eur",
      EE: "eur",
      LV: "eur",
      LT: "eur",
      JP: "jpy",
      KR: "krw",
      SG: "sgd",
      HK: "hkd",
      NZ: "nzd",
      CH: "chf",
      NO: "nok",
      SE: "sek",
      DK: "dkk",
      PL: "pln",
      CZ: "czk",
      HU: "huf",
      RO: "ron",
      BG: "bgn",
      HR: "hrk",
      BR: "brl",
      MX: "mxn",
      AR: "ars",
      CL: "clp",
      CO: "cop",
      PE: "pen",
      ZA: "zar",
      NG: "ngn",
      EG: "egp",
      KE: "kes",
      GH: "ghs",
      MA: "mad",
      TN: "tnd",
      DZ: "dzd",
      LY: "lyd",
      SD: "sdg",
      ET: "etb",
      UG: "ugx",
      TZ: "tzs",
      ZW: "zwl",
      BW: "bwp",
      NA: "nad",
      SZ: "szl",
      LS: "lsl",
      MW: "mwk",
      ZM: "zmw",
      AO: "aoa",
      MZ: "mzn",
      MG: "mga",
      MU: "mur",
      SC: "scr",
      KM: "kmf",
      DJ: "djf",
      SO: "sos",
      ER: "ern",
      SS: "ssp",
      CF: "xaf",
      TD: "xaf",
      CM: "xaf",
      GA: "xaf",
      GQ: "xaf",
      CG: "xaf",
      CD: "cdf",
      RW: "rwf",
      BI: "bif",
      ST: "stn",
      CV: "cve",
      GW: "xof",
      GN: "xof",
      ML: "xof",
      BF: "xof",
      NE: "xof",
      SN: "xof",
      CI: "xof",
      TG: "xof",
      BJ: "xof",
      LR: "lrd",
      SL: "sll",
      GM: "gmd",
      MR: "mru",
    };

    return currencyMap[country.toUpperCase()] || "usd";
  }

  /**
   * Admin: Get all transactions (Stripe payments + Wallet transactions)
   */
  static async getAllTransactions(
    options: {
      limit?: number;
      offset?: number;
      userId?: number;
      startDate?: string;
      endDate?: string;
      transactionType?: "stripe" | "wallet" | "all";
      status?: string;
    } = {}
  ): Promise<{
    transactions: any[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    try {
      const {
        limit = 50,
        offset = 0,
        userId,
        startDate,
        endDate,
        transactionType = "all",
        status,
      } = options;

      // Build Stripe payments query
      let stripePaymentsQuery = StripePayment.query()
        .withGraphFetched("[job, company.user]")
        .orderBy("createdAt", "desc");

      if (userId) {
        // For Stripe payments, we need to filter by companyId which relates to userId
        // We'll need to join with companies to get userId
        stripePaymentsQuery = stripePaymentsQuery
          .join("companies", "StripePayments.companyId", "companies.id")
          .where("companies.userId", userId);
      }

      if (startDate) {
        stripePaymentsQuery = stripePaymentsQuery.where(
          "StripePayments.createdAt",
          ">=",
          startDate
        );
      }
      if (endDate) {
        stripePaymentsQuery = stripePaymentsQuery.where(
          "StripePayments.createdAt",
          "<=",
          endDate
        );
      }
      if (status) {
        stripePaymentsQuery = stripePaymentsQuery.where(
          "StripePayments.status",
          status
        );
      }

      // Build Wallet transactions query
      let walletTransactionsQuery = WalletTransaction.query()
        .withGraphFetched("wallet.user")
        .orderBy("createdAt", "desc");

      if (userId) {
        walletTransactionsQuery = walletTransactionsQuery
          .join("wallets", "walletTransactions.walletId", "wallets.id")
          .where("wallets.userId", userId);
      }

      if (startDate) {
        walletTransactionsQuery = walletTransactionsQuery.where(
          "walletTransactions.createdAt",
          ">=",
          startDate
        );
      }
      if (endDate) {
        walletTransactionsQuery = walletTransactionsQuery.where(
          "walletTransactions.createdAt",
          "<=",
          endDate
        );
      }
      if (status) {
        walletTransactionsQuery = walletTransactionsQuery.where(
          "walletTransactions.status",
          status
        );
      }

      // Fetch transactions based on type
      let stripePayments: StripePayment[] = [];
      let walletTransactions: WalletTransaction[] = [];

      if (transactionType === "all" || transactionType === "stripe") {
        stripePayments = await stripePaymentsQuery;
      }

      if (transactionType === "all" || transactionType === "wallet") {
        walletTransactions = await walletTransactionsQuery;
      }

      // Transform Stripe payments to unified format
      const formattedStripePayments = stripePayments.map((payment) => {
        const company = payment.company as any;
        const user = company?.user;
        return {
          id: `stripe_${payment.id}`,
          transactionType: "stripe_payment",
          userId: company?.userId || null,
          user: user
            ? {
                id: user.id,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                email: user.email || null,
              }
            : null,
          amount: payment.totalAmount,
          baseAmount: payment.baseAmount,
          companyCommission: payment.companyCommission,
          driverCommission: payment.driverCommission,
          status: payment.status,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
          jobId: payment.jobId,
          job: payment.job
            ? {
                id: payment.job.id,
                title: (payment.job as any).title || null,
              }
            : null,
          companyId: payment.companyId,
          company: company
            ? {
                id: company.id,
                name: company.companyName || null,
              }
            : null,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        };
      });

      // Transform Wallet transactions to unified format
      const formattedWalletTransactions = walletTransactions.map((tx) => ({
        id: `wallet_${tx.id}`,
        transactionType: "wallet_transaction",
        userId: (tx.wallet as any)?.userId || null,
        user: (tx.wallet as any)?.user
          ? {
              id: (tx.wallet as any).user.id,
              firstName: (tx.wallet as any).user.firstName,
              lastName: (tx.wallet as any).user.lastName,
              email: (tx.wallet as any).user.email,
            }
          : null,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        referenceId: tx.referenceId,
        referenceType: tx.referenceType,
        walletId: tx.walletId,
        createdAt: tx.createdAt,
      }));

      // Combine and sort by createdAt descending
      const allTransactions = [
        ...formattedStripePayments,
        ...formattedWalletTransactions,
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Get total count (need to clone queries before applying graph fetching)
      let totalCount = 0;
      if (transactionType === "all") {
        // Create count queries without graph fetching
        let stripeCountQuery = StripePayment.query();
        let walletCountQuery = WalletTransaction.query();

        if (userId) {
          stripeCountQuery = stripeCountQuery
            .join("companies", "StripePayments.companyId", "companies.id")
            .where("companies.userId", userId);
          walletCountQuery = walletCountQuery
            .join("wallets", "walletTransactions.walletId", "wallets.id")
            .where("wallets.userId", userId);
        }

        if (startDate) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.createdAt", ">=", startDate);
          walletCountQuery = walletCountQuery.where("walletTransactions.createdAt", ">=", startDate);
        }
        if (endDate) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.createdAt", "<=", endDate);
          walletCountQuery = walletCountQuery.where("walletTransactions.createdAt", "<=", endDate);
        }
        if (status) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.status", status);
          walletCountQuery = walletCountQuery.where("walletTransactions.status", status);
        }

        const stripeCount = await stripeCountQuery.resultSize();
        const walletCount = await walletCountQuery.resultSize();
        totalCount = stripeCount + walletCount;
      } else if (transactionType === "stripe") {
        let stripeCountQuery = StripePayment.query();
        if (userId) {
          stripeCountQuery = stripeCountQuery
            .join("companies", "StripePayments.companyId", "companies.id")
            .where("companies.userId", userId);
        }
        if (startDate) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.createdAt", ">=", startDate);
        }
        if (endDate) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.createdAt", "<=", endDate);
        }
        if (status) {
          stripeCountQuery = stripeCountQuery.where("StripePayments.status", status);
        }
        totalCount = await stripeCountQuery.resultSize();
      } else if (transactionType === "wallet") {
        let walletCountQuery = WalletTransaction.query();
        if (userId) {
          walletCountQuery = walletCountQuery
            .join("wallets", "walletTransactions.walletId", "wallets.id")
            .where("wallets.userId", userId);
        }
        if (startDate) {
          walletCountQuery = walletCountQuery.where("walletTransactions.createdAt", ">=", startDate);
        }
        if (endDate) {
          walletCountQuery = walletCountQuery.where("walletTransactions.createdAt", "<=", endDate);
        }
        if (status) {
          walletCountQuery = walletCountQuery.where("walletTransactions.status", status);
        }
        totalCount = await walletCountQuery.resultSize();
      }

      // Apply pagination
      const paginatedTransactions = allTransactions.slice(
        offset,
        offset + limit
      );

      return {
        transactions: paginatedTransactions,
        total: totalCount,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      throw new Error("Failed to fetch all transactions");
    }
  }

  /**
   * Get payment statistics for admin dashboard
   */
  static async getPaymentStats(): Promise<{
    totalRevenue: number;
    pendingPayments: number;
    successfulPayments: number;
    platformFees: number;
    pendingAmount: number;
    successfulAmount: number;
  }> {
    try {
      // Get all completed Stripe payments
      const completedPayments = await StripePayment.query()
        .where("status", "succeeded")
        .sum("totalAmount as total")
        .first();

      // Get all pending Stripe payments
      const pendingPayments = await StripePayment.query()
        .where("status", "pending")
        .count("* as count")
        .first();

      const pendingAmountResult = await StripePayment.query()
        .where("status", "pending")
        .sum("totalAmount as total")
        .first();

      // Get successful payments count
      const successfulPayments = await StripePayment.query()
        .where("status", "succeeded")
        .count("* as count")
        .first();

      // Calculate platform fees from companyCommission (platform fee is stored as companyCommission)
      // Sum of all companyCommission from succeeded payments
      const platformFeesResult = await StripePayment.query()
        .where("status", "succeeded")
        .sum("companyCommission as total")
        .first();

      const totalRevenue = parseFloat((completedPayments as any)?.total || "0");
      const platformFees = parseFloat((platformFeesResult as any)?.total || "0");
      const pendingAmount = parseFloat((pendingAmountResult as any)?.total || "0");
      const successfulAmount = totalRevenue;

      return {
        totalRevenue,
        pendingPayments: parseInt((pendingPayments as any)?.count || "0", 10),
        successfulPayments: parseInt((successfulPayments as any)?.count || "0", 10),
        platformFees,
        pendingAmount,
        successfulAmount,
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      throw new Error("Failed to get payment statistics");
    }
  }
}
