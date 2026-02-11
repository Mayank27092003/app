import { FromSchema } from "json-schema-to-ts";

// Create Payment Intent Schema
export const createPaymentIntentSchema = {
  type: "object",
  required: ["amount"],
  additionalProperties: false,
  properties: {
    amount: { 
      type: "number", 
      minimum: 0.01,
      errorMessage: "Amount must be positive"
    },
    currency: { 
      type: "string", 
      enum: ["usd", "eur", "gbp", "cad", "aud", "inr", "jpy", "krw", "sgd", "hkd", "nzd", "chf", "nok", "sek", "dkk", "pln", "czk", "huf", "ron", "bgn", "hrk", "brl", "mxn", "ars", "clp", "cop", "pen", "zar", "ngn", "egp", "kes", "ghs", "mad", "tnd", "dzd", "lyd", "sdg", "etb", "ugx", "tzs", "zwl", "bwp", "nad", "szl", "lsl", "mwk", "zmw", "aoa", "mzn", "mga", "mur", "scr", "kmf", "djf", "sos", "ern", "ssp", "xaf", "cdf", "rwf", "bif", "stn", "cve", "xof", "lrd", "sll", "gmd", "gnf", "mru"],
      default: "usd"
    },
  },
  errorMessage: {
    required: {
      amount: "Amount is required",
    },
    properties: {
      amount: "Amount must be positive",
    },
  },
} as const;

// Confirm Payment Schema
export const confirmPaymentSchema = {
  type: "object",
  required: ["paymentIntentId"],
  additionalProperties: false,
  properties: {
    paymentIntentId: { 
      type: "string", 
      minLength: 1,
      errorMessage: "Payment intent ID is required"
    },
  },
  errorMessage: {
    required: {
      paymentIntentId: "Payment intent ID is required",
    },
  },
} as const;

// Add Bank Account Schema
export const addBankAccountSchema = {
  type: "object",
  required: ["accountNumber", "accountHolderName", "accountType", "bankName", "country"],
  additionalProperties: false,
  properties: {
    accountNumber: { 
      type: "string", 
      minLength: 4,
      maxLength: 34, // IBAN can be up to 34 characters
      errorMessage: "Account number must be 4-34 characters"
    },
    routingNumber: { 
      type: "string", 
      nullable: true,
      errorMessage: "Routing number/IFSC/Sort code/BSB (required for US/IN/GB/AU/CA accounts, passed as routing_number to Stripe)"
    },
    accountHolderName: { 
      type: "string", 
      minLength: 2,
      maxLength: 100,
      errorMessage: "Account holder name must be 2-100 characters"
    },
    accountType: { 
      type: "string", 
      enum: ["checking", "savings"],
      errorMessage: "Account type must be 'checking' or 'savings'"
    },
    bankName: { 
      type: "string", 
      minLength: 2,
      maxLength: 100,
      errorMessage: "Bank name must be 2-100 characters"
    },
    country: { 
      type: "string", 
      minLength: 2,
      maxLength: 2,
      pattern: "^[A-Z]{2}$",
      errorMessage: "Country code must be 2 uppercase letters (e.g., US, CA, GB)"
    },
  },
  errorMessage: {
    required: {
      accountNumber: "Account number is required",
      accountHolderName: "Account holder name is required",
      accountType: "Account type is required",
      bankName: "Bank name is required",
      country: "Country code is required",
    },
    properties: {
      accountNumber: "Account number must be 4-34 characters",
      accountHolderName: "Account holder name must be 2-100 characters",
      accountType: "Account type must be 'checking' or 'savings'",
      bankName: "Bank name must be 2-100 characters",
      country: "Country code must be 2 uppercase letters (e.g., US, CA, GB)",
    },
  },
} as const;

// Verify Bank Account Schema
export const verifyBankAccountSchema = {
  type: "object",
  required: ["bankAccountId", "amounts"],
  additionalProperties: false,
  properties: {
    bankAccountId: { 
      type: "string", 
      minLength: 1,
      errorMessage: "Bank account ID is required"
    },
    amounts: { 
      type: "array", 
      items: { type: "number", minimum: 0.01 },
      minItems: 2,
      maxItems: 2,
      errorMessage: "Exactly 2 amounts are required for verification"
    },
  },
  errorMessage: {
    required: {
      bankAccountId: "Bank account ID is required",
      amounts: "Verification amounts are required",
    },
    properties: {
      amounts: "Exactly 2 amounts are required for verification",
    },
  },
} as const;

// Create Withdrawal Schema
export const createWithdrawalSchema = {
  type: "object",
  required: ["amount"],
  additionalProperties: false,
  properties: {
    amount: { 
      type: "number", 
      minimum: 0.01,
      errorMessage: "Amount must be positive"
    },
  },
  errorMessage: {
    required: {
      amount: "Amount is required",
    },
    properties: {
      amount: "Amount must be positive",
    },
  },
} as const;

// Get Wallet Transactions Schema
export const getWalletTransactionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { 
      type: "integer", 
      minimum: 1,
      maximum: 100,
      default: 50
    },
    offset: { 
      type: "integer", 
      minimum: 0,
      default: 0
    },
  },
} as const;

// Admin Transfer Schema
export const adminTransferSchema = {
  type: "object",
  required: ["userId", "amount"],
  additionalProperties: false,
  properties: {
    userId: { 
      type: "integer", 
      minimum: 1,
      errorMessage: "User ID is required"
    },
    amount: { 
      type: "number", 
      minimum: 0.01,
      errorMessage: "Amount must be positive"
    },
    description: { 
      type: "string", 
      maxLength: 500,
      nullable: true,
      errorMessage: "Description must be less than 500 characters"
    },
  },
  errorMessage: {
    required: {
      userId: "User ID is required",
      amount: "Amount is required",
      bankAccountId: "Bank account ID is required",
    },
    properties: {
      userId: "User ID must be a positive integer",
      amount: "Amount must be positive",
      bankAccountId: "Bank account ID is required",
    },
  },
} as const;

// Get Verified Bank Accounts Schema
export const getVerifiedBankAccountsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { 
      type: "integer", 
      minimum: 1,
      maximum: 100,
      default: 50
    },
    offset: { 
      type: "integer", 
      minimum: 0,
      default: 0
    },
  },
} as const;

// ========== Types ==========
export type CreatePaymentIntentInput = FromSchema<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = FromSchema<typeof confirmPaymentSchema>;
export type AddBankAccountInput = FromSchema<typeof addBankAccountSchema>;
export type VerifyBankAccountInput = FromSchema<typeof verifyBankAccountSchema>;
export type CreateWithdrawalInput = FromSchema<typeof createWithdrawalSchema>;
export type GetWalletTransactionsInput = FromSchema<typeof getWalletTransactionsSchema>;
export type AdminTransferInput = FromSchema<typeof adminTransferSchema>;
export type GetVerifiedBankAccountsInput = FromSchema<typeof getVerifiedBankAccountsSchema>;
