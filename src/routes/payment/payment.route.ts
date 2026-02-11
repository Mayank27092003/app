import { PaymentController } from "../../controllers/payment/payment.controller";
import { buildValidator, validate } from "../../middlewares/validate";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  addBankAccountSchema,
  verifyBankAccountSchema,
  createWithdrawalSchema,
  getWalletTransactionsSchema,
  adminTransferSchema,
  getVerifiedBankAccountsSchema,
} from "../../validators/payment.schema";
import type { RouteDefinition } from "../types";
import {
  getWalletBalanceDoc,
  getWalletTransactionsDoc,
  createPaymentIntentDoc,
  confirmPaymentDoc,
  getBankAccountsDoc,
  addBankAccountDoc,
  verifyBankAccountDoc,
  deleteBankAccountDoc,
  createWithdrawalDoc,
  getPaymentMethodsDoc,
  handleWebhookDoc,
} from "./swagger/payment.swagger";
import { CONNECT_DOCS } from "./swagger/connect.swagger";

const controller = new PaymentController();

const routes: RouteDefinition[] = [
  // Wallet endpoints
  {
    path: "/wallet/balance",
    controller: { get: controller.getWalletBalance },
    middlewares: { get: [authenticateToken] },
    docs: getWalletBalanceDoc,
  },
  {
    path: "/wallet/transactions",
    controller: { get: controller.getWalletTransactions },
    middlewares: { get: [authenticateToken] },
    // validators: { get: validate(buildValidator(getWalletTransactionsSchema)) },
    docs: getWalletTransactionsDoc,
  },

  // Payment intent endpoints
  {
    path: "/payment-intent",
    controller: { post: controller.createPaymentIntent },
    middlewares: { post: [authenticateToken] },
    validators: { post: validate(buildValidator(createPaymentIntentSchema)) },
    docs: createPaymentIntentDoc,
  },
  {
    path: "/payment/confirm",
    controller: { post: controller.confirmPayment },
    middlewares: { post: [authenticateToken] },
    validators: { post: validate(buildValidator(confirmPaymentSchema)) },
    docs: confirmPaymentDoc,
  },

  // Bank account endpoints
  {
    path: "/bank-accounts",
    controller: { 
      get: controller.getBankAccounts,
      post: controller.addBankAccount,
    },
    middlewares: { 
      get: [authenticateToken],
      post: [authenticateToken],
    },
    validators: { post: validate(buildValidator(addBankAccountSchema)) },
    docs: {
      get: getBankAccountsDoc.get,
      post: {
        summary: "Add bank account (ACH supported countries only)",
        tags: ["Bank Accounts"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["accountNumber", "accountHolderName", "accountType", "bankName", "country"],
                properties: {
                  accountNumber: {
                    type: "string",
                    minLength: 4,
                    maxLength: 34,
                    description: "Bank account number"
                  },
                  routingNumber: {
                    type: "string",
                    description: "Routing number/IFSC/Sort code/BSB (required for US/IN/GB/AU/CA)"
                  },
                  accountHolderName: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                    description: "Account holder name"
                  },
                  accountType: {
                    type: "string",
                    enum: ["checking", "savings"],
                    description: "Account type"
                  },
                  bankName: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                    description: "Bank name"
                  },
                  country: {
                    type: "string",
                    minLength: 2,
                    maxLength: 2,
                    pattern: "^[A-Z]{2}$",
                    description: "Country code (e.g., US, IN, GB, AU, CA)"
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Bank account created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        userId: { type: "integer" },
                        bankName: { type: "string" },
                        last4: { type: "string" },
                        country: { type: "string" },
                        currency: { type: "string" },
                        isVerified: { type: "boolean" },
                        isActive: { type: "boolean" },
                      },
                    },
                    transferMethod: {
                      type: "string",
                      enum: ["ACH"],
                      description: "Transfer method used (only ACH supported)"
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/bank-accounts/verify",
    controller: { post: controller.verifyBankAccount },
    middlewares: { post: [authenticateToken] },
    validators: { post: validate(buildValidator(verifyBankAccountSchema)) },
    docs: verifyBankAccountDoc,
  },
  {
    path: "/bank-accounts/:bankAccountId",
    controller: { delete: controller.deleteBankAccount },
    middlewares: { delete: [authenticateToken] },
    docs: deleteBankAccountDoc,
  },

  // Withdrawal endpoints
  {
    path: "/withdrawals",
    controller: { post: controller.createWithdrawal },
    middlewares: { post: [authenticateToken] },
    validators: { post: validate(buildValidator(createWithdrawalSchema)) },
    docs: createWithdrawalDoc,
  },

  // Payment methods endpoints
  {
    path: "/payment-methods",
    controller: { get: controller.getPaymentMethods },
    middlewares: { get: [authenticateToken] },
    docs: getPaymentMethodsDoc,
  },

  // Stripe Connect account/bank management (user-scoped)
  {
    path: "/connect/manage-bank-accounts",
    controller: { get: controller.manageConnectedBankAccounts },
    middlewares: { get: [authenticateToken] },
    docs: CONNECT_DOCS.manageBankAccountsDoc,
  },
  {
    path: "/connect/bank-accounts",
    controller: { get: controller.listConnectedBankAccounts },
    middlewares: { get: [authenticateToken] },
    docs: CONNECT_DOCS.listConnectedBankAccountsDoc,
  },
  {
    path: "/connect/account-link",
    controller: { post: controller.generateConnectAccountLink },
    middlewares: { post: [authenticateToken] },
    docs: CONNECT_DOCS.connectAccountLinkDoc,
  },

  // Transfer pending payouts when Stripe account is connected
  {
    path: "/transfer-pending-payouts",
    controller: { post: controller.transferPendingPayouts },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Transfer pending contract payouts to connected Stripe account",
        tags: ["Payouts", "Stripe Connect"],
        responses: {
          200: {
            description: "Pending payouts transferred successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        transferred: { type: "integer" },
                        failed: { type: "integer" },
                        payouts: {
                          type: "array",
                          items: { type: "object" },
                        },
                      },
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "User does not have active Stripe account" },
          401: { description: "Unauthorized" },
        },
      },
    },
  },

  // Webhook endpoint (no authentication needed)
  {
    path: "/webhooks/stripe",
    controller: { post: controller.handleWebhook },
    useRawBody: true, // Stripe webhook needs raw body for signature verification
    docs: handleWebhookDoc,
  },

  // Admin endpoints
  {
    path: "/admin/verified-bank-accounts",
    controller: { get: controller.getAllVerifiedBankAccounts },
    middlewares: { get: [authenticateToken] },
    validators: { get: validate(buildValidator(getVerifiedBankAccountsSchema)) },
    docs: {
      get: {
        summary: "Get all verified bank accounts (Admin only)",
        tags: ["Admin", "Bank Accounts"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            description: "Number of records to return",
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
            description: "Number of records to skip",
          },
        ],
        responses: {
          200: {
            description: "Verified bank accounts retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          userId: { type: "integer" },
                          bankName: { type: "string" },
                          last4: { type: "string" },
                          country: { type: "string" },
                          currency: { type: "string" },
                          isVerified: { type: "boolean" },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              firstName: { type: "string" },
                              lastName: { type: "string" },
                              email: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/admin/transactions",
    controller: { get: controller.getAllTransactions },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get all transactions (Stripe payments + Wallet transactions) - Admin only",
        tags: ["Admin", "Transactions"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            description: "Number of records to return",
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
            description: "Number of records to skip",
          },
          {
            name: "userId",
            in: "query",
            schema: { type: "integer" },
            description: "Filter by user ID",
          },
          {
            name: "startDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter transactions from this date",
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter transactions until this date",
          },
          {
            name: "transactionType",
            in: "query",
            schema: { type: "string", enum: ["stripe", "wallet", "all"], default: "all" },
            description: "Filter by transaction type",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" },
            description: "Filter by status (e.g., 'succeeded', 'pending', 'failed', 'processed')",
          },
        ],
        responses: {
          200: {
            description: "Transactions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          transactionType: { type: "string", enum: ["stripe_payment", "wallet_transaction"] },
                          userId: { type: ["integer", "null"] },
                          user: {
                            type: ["object", "null"],
                            properties: {
                              id: { type: "integer" },
                              firstName: { type: "string" },
                              lastName: { type: "string" },
                              email: { type: "string" },
                            },
                          },
                          amount: { type: "number" },
                          status: { type: "string" },
                          createdAt: { type: "string" },
                          // Stripe payment specific fields
                          baseAmount: { type: ["number", "null"] },
                          companyCommission: { type: ["number", "null"] },
                          driverCommission: { type: ["number", "null"] },
                          stripePaymentIntentId: { type: ["string", "null"] },
                          stripeCheckoutSessionId: { type: ["string", "null"] },
                          jobId: { type: ["integer", "null"] },
                          job: { type: ["object", "null"] },
                          companyId: { type: ["integer", "null"] },
                          company: { type: ["object", "null"] },
                          // Wallet transaction specific fields
                          type: { type: ["string", "null"], enum: ["credit", "debit", "hold", "release", "withdrawal"] },
                          description: { type: ["string", "null"] },
                          referenceId: { type: ["string", "null"] },
                          referenceType: { type: ["string", "null"] },
                          walletId: { type: ["integer", "null"] },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        total: { type: "integer" },
                        hasMore: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Admin access required" },
        },
      },
    },
  },
  {
    path: "/admin/transfer",
    controller: { post: controller.adminTransferToBankAccount },
    middlewares: { post: [authenticateToken] },
    validators: { post: validate(buildValidator(adminTransferSchema)) },
    docs: {
      post: {
        summary: "Transfer money to verified bank account (Admin only)",
        tags: ["Admin", "Transfers"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "amount", "bankAccountId"],
                properties: {
                  userId: {
                    type: "integer",
                    minimum: 1,
                    description: "ID of the user to transfer money to",
                  },
                  amount: {
                    type: "number",
                    minimum: 0.01,
                    description: "Amount to transfer",
                  },
                  bankAccountId: {
                    type: "string",
                    description: "Bank account ID to transfer to",
                  },
                  description: {
                    type: "string",
                    maxLength: 500,
                    description: "Optional description for the transfer",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Transfer completed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "integer" },
                        currency: { type: "string" },
                        status: { type: "string" },
                      },
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/supported-countries",
    controller: { get: controller.getSupportedCountries },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get countries that support bank account transfers",
        tags: ["Bank Accounts"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Supported countries retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        supportedCountries: {
                          type: "array",
                          items: { type: "string" },
                          description: "List of country codes that support bank transfers"
                        },
                        message: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/admin/stats",
    controller: { get: controller.getPaymentStats },
    middlewares: { get: [authenticateToken, requireRole(["admin"])] },
    docs: {
      get: {
        summary: "Get payment statistics - Admin only",
        tags: ["Admin", "Payments"],
        responses: {
          200: {
            description: "Payment statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        totalRevenue: { type: "number", description: "Total revenue from completed payments" },
                        pendingPayments: { type: "integer", description: "Number of pending payments" },
                        successfulPayments: { type: "integer", description: "Number of successful payments" },
                        platformFees: { type: "number", description: "Total platform fees collected" },
                        pendingAmount: { type: "number", description: "Total amount of pending payments" },
                        successfulAmount: { type: "number", description: "Total amount of successful payments" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin access required" },
        },
      },
    },
  },
];

export default routes;
