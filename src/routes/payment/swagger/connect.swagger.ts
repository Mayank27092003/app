// Stripe Connect endpoint docs, requests use only userId (never accountId/bankAccountId)

const BankAccount = {
  type: "object",
  properties: {
    id: { type: "string" },
    bank_name: { type: "string", nullable: true },
    last4: { type: "string" },
    currency: { type: "string" },
    country: { type: "string" },
    status: { type: "string" },
    default_for_currency: { type: "boolean" },
    account_holder_name: { type: "string", nullable: true },
  },
};

const manageBankAccountsDoc = {
  get: {
    summary: "Get or create user's Connect account and list external bank accounts.",
    tags: ["Stripe Connect"],
    responses: {
      200: {
        description: "Current Connect account status, external bank accounts, onboarding link if needed.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: {
                  type: "object",
                  properties: {
                    accountId: { type: "string" },
                    payoutsEnabled: { type: "boolean" },
                    chargesEnabled: { type: "boolean" },
                    detailsSubmitted: { type: "boolean" },
                    bankAccounts: { type: "array", items: BankAccount },
                    onboardingUrl: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User has no connected Stripe account.",
        content: {
          "application/json": {
            schema: { type: "object", properties: { error: { type: "string" } } },
            example: { error: "User does not have a connected Stripe account." },
          },
        },
      },
    },
  },
};

const connectAccountLinkDoc = {
  post: {
    summary: "Generate a fresh onboarding/update link for user's Connect account (by userId)",
    tags: ["Stripe Connect"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["userId"],
            properties: {
              userId: { type: "string" },
              refreshUrl: { type: "string", description: "Optional custom refresh URL" },
              returnUrl: { type: "string", description: "Optional custom return URL" },
              type: { type: "string", enum: ["account_onboarding", "account_update"], description: "Link type" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Stripe onboarding/update link for this Connect account.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: {
                  type: "object",
                  properties: {
                    accountId: { type: "string" },
                    url: { type: "string" },
                    created: { type: "number", description: "Epoch ms timestamp" },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User has no connected Stripe account.",
        content: {
          "application/json": {
            schema: { type: "object", properties: { error: { type: "string" } } },
            example: { error: "User does not have a connected Stripe account." },
          },
        },
      },
    },
  },
};

const listConnectedBankAccountsDoc = {
  get: {
    summary: "List external bank accounts for the user's Connect account.",
    tags: ["Stripe Connect"],
    parameters: [
      {
        name: "userId",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "User identifier. accountId lookup is automatic."
      },
    ],
    responses: {
      200: {
        description: "List of bank accounts for the Connect account.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                accountId: { type: "string" },
                data: { type: "array", items: BankAccount },
              },
            },
          },
        },
      },
      404: {
        description: "User has no connected Stripe account.",
        content: {
          "application/json": {
            schema: { type: "object", properties: { error: { type: "string" } } },
            example: { error: "User does not have a connected Stripe account." },
          },
        },
      },
    },
  },
};

export const CONNECT_DOCS = {
  BankAccount,
  manageBankAccountsDoc,
  connectAccountLinkDoc,
  listConnectedBankAccountsDoc,
};
