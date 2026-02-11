export const getWalletBalanceDoc = {
  get: {
    summary: "Get wallet balance",
    description: "Retrieve the current wallet balance for the authenticated user",
    tags: ["Payment"],
    responses: {
      "200": {
        description: "Wallet balance retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    userId: { type: "integer", example: 1 },
                    availableBalance: { type: "number", example: 150.75 },
                    onHold: { type: "number", example: 25.00 },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to get wallet balance" },
    },
  },
};

export const getWalletTransactionsDoc = {
  get: {
    summary: "Get wallet transactions",
    description: "Retrieve wallet transaction history for the authenticated user",
    tags: ["Payment"],
    parameters: [
      {
        name: "limit",
        in: "query",
        description: "Number of transactions to return",
        required: false,
        schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
      },
      {
        name: "offset",
        in: "query",
        description: "Number of transactions to skip",
        required: false,
        schema: { type: "integer", default: 0, minimum: 0 },
      },
    ],
    responses: {
      "200": {
        description: "Transactions retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      walletId: { type: "integer", example: 1 },
                      type: { 
                        type: "string", 
                        enum: ["credit", "debit", "hold", "release", "withdrawal"],
                        example: "credit"
                      },
                      amount: { type: "number", example: 100.00 },
                      status: { 
                        type: "string", 
                        enum: ["initial", "withdrawal_requested", "processing", "processed", "failed", "cancelled"],
                        example: "processed"
                      },
                      description: { type: "string", example: "Funds added via Stripe payment" },
                      referenceId: { type: "integer", nullable: true, example: 123 },
                      referenceType: { type: "string", nullable: true, example: "stripe_payment" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to get wallet transactions" },
    },
  },
};

export const createPaymentIntentDoc = {
  post: {
    summary: "Create payment intent for adding funds",
    description: "Create a Stripe payment intent to add funds to the user's wallet",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["amount"],
            properties: {
              amount: { 
                type: "number", 
                minimum: 0.01,
                example: 100.00,
                description: "Amount to add to wallet in USD"
              },
              currency: { 
                type: "string", 
                enum: ["usd", "eur", "gbp"],
                default: "usd",
                example: "usd"
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Payment intent created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    clientSecret: { 
                      type: "string", 
                      example: "pi_1234567890_secret_abcdef" 
                    },
                    paymentIntentId: { 
                      type: "string", 
                      example: "pi_1234567890" 
                    },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "Invalid amount" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to create payment intent" },
    },
  },
};

export const confirmPaymentDoc = {
  post: {
    summary: "Confirm payment and add funds to wallet",
    description: "Confirm a payment intent and add the funds to the user's wallet",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["paymentIntentId"],
            properties: {
              paymentIntentId: { 
                type: "string", 
                example: "pi_1234567890",
                description: "Stripe payment intent ID"
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Payment confirmed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    walletId: { type: "integer", example: 1 },
                    type: { type: "string", example: "credit" },
                    amount: { type: "number", example: 100.00 },
                    status: { type: "string", example: "processed" },
                    description: { type: "string", example: "Funds added via Stripe payment" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "Payment intent ID is required" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to confirm payment" },
    },
  },
};

export const getBankAccountsDoc = {
  get: {
    summary: "Get user's bank accounts",
    description: "Retrieve all bank accounts connected to the user's account",
    tags: ["Payment"],
    responses: {
      "200": {
        description: "Bank accounts retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      userId: { type: "integer", example: 1 },
                      providerId: { type: "integer", example: 1 },
                      externalBankId: { type: "string", example: "ba_1234567890" },
                      bankName: { type: "string", example: "Chase Bank" },
                      last4: { type: "string", example: "1234" },
                      country: { type: "string", example: "US" },
                      currency: { type: "string", example: "usd" },
                      isDefault: { type: "boolean", example: false },
                      isVerified: { type: "boolean", example: true },
                      isActive: { type: "boolean", example: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to get bank accounts" },
    },
  },
};

export const addBankAccountDoc = {
  post: {
    summary: "Add bank account",
    description: "Add a new bank account for withdrawals. Supports international accounts but transfers are always in USD.",
    tags: ["Payment"],
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
                example: "1234567890",
                description: "Bank account number (4-34 characters, supports IBAN)"
              },
              routingNumber: { 
                type: "string", 
                nullable: true,
                example: "123456789",
                description: "Bank routing number (required for US accounts only)"
              },
              accountHolderName: { 
                type: "string", 
                minLength: 2,
                maxLength: 100,
                example: "John Doe",
                description: "Name on the bank account"
              },
              accountType: { 
                type: "string", 
                enum: ["checking", "savings"],
                example: "checking",
                description: "Type of bank account"
              },
              bankName: { 
                type: "string", 
                minLength: 2,
                maxLength: 100,
                example: "Chase Bank",
                description: "Name of the bank"
              },
              country: { 
                type: "string", 
                minLength: 2,
                maxLength: 2,
                pattern: "^[A-Z]{2}$",
                example: "US",
                description: "Country code (ISO 3166-1 alpha-2)"
              },
            },
          },
          examples: {
            usAccount: {
              summary: "US Bank Account",
              value: {
                accountNumber: "1234567890",
                routingNumber: "021000021",
                accountHolderName: "John Doe",
                accountType: "checking",
                bankName: "Chase Bank",
                country: "US",
              },
            },
            internationalAccount: {
              summary: "International Bank Account",
              value: {
                accountNumber: "GB29NWBK60161331926819",
                accountHolderName: "Jane Smith",
                accountType: "checking",
                bankName: "Barclays Bank",
                country: "GB",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Bank account added successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    userId: { type: "integer", example: 1 },
                    providerId: { type: "integer", example: 1 },
                    externalBankId: { type: "string", example: "ba_1234567890" },
                    bankName: { type: "string", example: "Bank Account" },
                    last4: { type: "string", example: "7890" },
                    country: { type: "string", example: "US" },
                    currency: { type: "string", example: "usd" },
                    isDefault: { type: "boolean", example: false },
                    isVerified: { type: "boolean", example: false },
                    isActive: { type: "boolean", example: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "All bank account fields are required" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to add bank account" },
    },
  },
};

export const verifyBankAccountDoc = {
  post: {
    summary: "Verify bank account with micro-deposits",
    description: "Verify a bank account using the micro-deposit amounts sent by Stripe",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["bankAccountId", "amounts"],
            properties: {
              bankAccountId: { 
                type: "string", 
                example: "ba_1234567890",
                description: "Stripe bank account ID"
              },
              amounts: { 
                type: "array", 
                items: { type: "number", minimum: 0.01 },
                minItems: 2,
                maxItems: 2,
                example: [0.32, 0.45],
                description: "Two micro-deposit amounts (in cents)"
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Bank account verification result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Bank account verified successfully" },
              },
            },
          },
        },
      },
      "400": { description: "Bank account ID and amounts are required" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to verify bank account" },
    },
  },
};

export const deleteBankAccountDoc = {
  delete: {
    summary: "Delete bank account",
    description: "Remove a bank account from the user's account",
    tags: ["Payment"],
    parameters: [
      {
        name: "bankAccountId",
        in: "path",
        required: true,
        description: "Stripe bank account ID",
        schema: { type: "string", example: "ba_1234567890" },
      },
    ],
    responses: {
      "200": {
        description: "Bank account deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Bank account deleted successfully" },
              },
            },
          },
        },
      },
      "400": { description: "Bank account ID is required" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to delete bank account" },
    },
  },
};

export const createWithdrawalDoc = {
  post: {
    summary: "Create withdrawal request",
    description: "Create a withdrawal request to transfer funds from wallet to bank account",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["amount"],
            properties: {
              amount: { 
                type: "number", 
                minimum: 0.01,
                example: 50.00,
                description: "Amount to withdraw from wallet"
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Withdrawal request created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "tr_1234567890" },
                    amount: { type: "number", example: 5000 },
                    currency: { type: "string", example: "usd" },
                    destination: { type: "string", example: "ba_1234567890" },
                    status: { type: "string", example: "pending" },
                    created: { type: "number", example: 1640995200 },
                  },
                },
                message: { type: "string", example: "Withdrawal request created successfully" },
              },
            },
          },
        },
      },
      "400": { description: "Invalid amount or bank account ID is required" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to create withdrawal" },
    },
  },
};

export const getPaymentMethodsDoc = {
  get: {
    summary: "Get user's payment methods",
    description: "Retrieve all saved payment methods for the user",
    tags: ["Payment"],
    responses: {
      "200": {
        description: "Payment methods retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      userId: { type: "integer", example: 1 },
                      providerId: { type: "integer", example: 1 },
                      externalMethodId: { type: "string", example: "pm_1234567890" },
                      type: { type: "string", example: "card" },
                      isDefault: { type: "boolean", example: false },
                      isActive: { type: "boolean", example: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to get payment methods" },
    },
  },
};

export const handleWebhookDoc = {
  post: {
    summary: "Handle Stripe webhooks",
    description: "Process Stripe webhook events for payment status updates",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            description: "Stripe webhook payload",
            properties: {
              id: { type: "string", example: "evt_1234567890" },
              object: { type: "string", example: "event" },
              type: { type: "string", example: "payment_intent.succeeded" },
              data: {
                type: "object",
                description: "Event data object",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                received: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      "400": { description: "Webhook handling failed" },
    },
  },
};
