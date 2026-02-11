// OpenAPI docs for Stripe Connect endpoints (No security descriptors)

export const BankAccount = {
  type: "object",
  properties: {
    id: { type: "string" },
    bank_name: { type: "string", nullable: true },
    last4: { type: "string" },
    currency: { type: "string" },
    country: { type: "string" },
    status: { type: "string" },
    default_for_currency: { type: "boolean" },
    account_holder_name: { type: "string", nullable: true }
  }
};

export const manageBankAccountsDoc = {
  get: {
    summary: "Get or create user's Connect account and list external bank accounts",
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
                    bankAccounts: {
                      type: "array",
                      items: BankAccount
                    },
                    onboardingUrl: { type: "string", nullable: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const connectAccountLinkDoc = {
  post: {
    summary: "Generate a fresh onboarding/update link for user's Connect account",
    tags: ["Stripe Connect"],
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              refreshUrl: { type: "string", description: "Optional custom refresh URL" },
              returnUrl: { type: "string", description: "Optional custom return URL" },
              type: { type: "string", enum: ["account_onboarding", "account_update"], description: "Link type" }
            }
          }
        }
      }
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
                    created: { type: "number", description: "Epoch ms timestamp" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const listConnectedBankAccountsDoc = {
  get: {
    summary: "List external bank accounts for the user's Connect account",
    tags: ["Stripe Connect"],
    parameters: [
      {
        name: "accountId",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "The Stripe Connect account ID (omit for your own)"
      }
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
                data: {
                  type: "array",
                  items: BankAccount
                }
              }
            }
          }
        }
      }
    }
  }
};
