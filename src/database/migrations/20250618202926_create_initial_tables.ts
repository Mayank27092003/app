import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'roles' table...");
  await knex.schema.createTable("roles", (table) => {
    table.increments("id").primary();
    table.string("name").unique().notNullable();
    table.string("description");
    table.boolean("isCompanyRole").defaultTo(false);
    table.integer("jobPostFee").defaultTo(0); // charge in cents
    table.integer("sortOrder").defaultTo(0);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("paymentProviders", (table) => {
    table.increments("id").primary();
    table.string("name").unique().notNullable(); // e.g., "stripe", "paypal"
    table.string("description").nullable();
    table.boolean("isEnabled").defaultTo(true);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'users' table...");
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
  
    // Name fields
    table.string("firstName").notNullable();
    table.string("middleName").nullable();
    table.string("lastName").notNullable();
  
    // Auth fields
    table.string("userName").notNullable(); // Made unique
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
  
    // Email verification
    table.boolean("isEmailVerified").defaultTo(false);
    table.timestamp("emailVerifiedAt").nullable();
    table.string("emailVerificationToken").nullable();
    table.timestamp("emailVerificationTokenExpiresAt").nullable();
  
    // Password reset
    table.string("passwordResetToken").nullable();
    table.timestamp("passwordResetTokenExpiresAt").nullable();
  
    // Timestamps
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });
  

  console.log("🔄 Creating 'otpVerifications' table...");
  await knex.schema.createTable("otpVerifications", (table) => {
    table.increments("id").primary();
    table.integer("userId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.enu("type", ["email", "phone"]).defaultTo("email");
    table.enu("purpose", [
      "email_verification",
      "phone_verification",
      "login_2fa",
      "payment_authorization",
      "password_reset",
    ]).notNullable();
    table.string("otpCode").notNullable(); // bcrypt hashed
    table.boolean("isUsed").defaultTo(false);
    table.timestamp("expiresAt").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'userRoles' table...");
  await knex.schema.createTable("userRoles", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table.integer("sortOrder").defaultTo(0);
    table.timestamp("assignedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'admins' table...");
  await knex.schema.createTable("admins", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'companyTypes' table...");
  await knex.schema.createTable("companyTypes", (table) => {
    table.increments("id").primary();
    table.string("name").unique().notNullable();
    table.string("description").nullable();
    table.integer("sortOrder").defaultTo(0);
  });

  console.log("🔄 Creating 'companies' table...");
  await knex.schema.createTable("companies", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("companyName").notNullable();
    table
      .integer("companyTypeId")
      .unsigned()
      .references("id")
      .inTable("companyTypes")
      .onDelete("SET NULL");
    table.string("industryType");
    table.string("contactNumber");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });

  console.log("🔄 Creating 'companyUsers' table...");
  await knex.schema.createTable("companyUsers", (table) => {
    table.increments("id").primary();
    table
      .integer("companyId")
      .unsigned()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.boolean("isPrimary").defaultTo(false);
    table.string("roleInCompany").defaultTo("member");
    table.unique(["companyId", "userId"]);
  });

  console.log("🔄 Creating 'drivers' table...");
  await knex.schema.createTable("drivers", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("licenseNumber").notNullable();
    table.string("twicNumber");
    table.string("medicalCertificate");
    table.string("drugTestResult");
    table.boolean("verified").defaultTo(false);
    table.integer("workRadius").nullable();
    table
      .integer("originCompanyId")
      .unsigned()
      .references("id")
      .inTable("companies")
      .onDelete("SET NULL");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });

  console.log("🔄 Creating 'jobs' table...");
  await knex.schema.createTable("jobs", (table) => {
    table.increments("id").primary();
    table
      .integer("companyId")
      .unsigned()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");
    table.string("title").notNullable();
    table.text("description");
    table.decimal("payAmount");
    table.enu("jobType", ["short", "medium", "long"]);
    table
      .enu("status", ["draft", "active", "completed", "cancelled"])
      .defaultTo("draft");
    table.timestamp("startDate");
    table.timestamp("endDate");
    table.decimal("tonuAmount").nullable();
    table.boolean("isTonuEligible").defaultTo(false);
    table.jsonb("pickupLocation").nullable();
    table.jsonb("dropoffLocation").nullable();
    table.string("payoutStatus").defaultTo("pending");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });
  await knex.schema.createTable("jobPostingFees", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("chargedByRoleId")
      .unsigned()
      .references("id")
      .inTable("roles");
    table.decimal("amount", 10, 2).notNullable();
    table.timestamp("chargedAt").defaultTo(knex.fn.now());
  });
  console.log("🔄 Creating 'jobVisibilityRoles' table...");
  await knex.schema.createTable("jobVisibilityRoles", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table.integer("sortOrder").defaultTo(0);
  });

  console.log("🔄 Creating 'jobApplications' table...");
  await knex.schema.createTable("jobApplications", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("applicantUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("driverId")
      .unsigned()
      .references("id")
      .inTable("drivers")
      .onDelete("SET NULL");
    table
      .enu("status", ["applied", "accepted", "cancelled", "completed"])
      .defaultTo("applied");
    table.timestamp("appliedAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });

  await knex.schema.createTable("contracts", (table) => {
    table.increments("id").primary();

    // Optional link to job (can be NULL for direct contracts)
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("SET NULL");

    // Generic parties (user ↔ user)
    table
      .integer("hiredByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL"); // The one who hires

    table
      .integer("hiredUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL"); // The one who is hired (usually driver)

    table.decimal("amount", 10, 2).notNullable();

    table
      .enu("billingCycle", ["hourly", "weekly", "monthly"])
      .defaultTo("weekly");

    table
      .enu("status", ["active", "paused", "cancelled", "completed"])
      .defaultTo("active");

    table.timestamp("nextBillingDate").notNullable();
    table.integer("retryCount").defaultTo(0);
    table.timestamp("lastAttemptedAt").nullable();
    table.text("notes").nullable();

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'contractPaymentFailures' table...");
  await knex.schema.createTable("contractPaymentFailures", (table) => {
    table.increments("id").primary();

    table
      .integer("contractId")
      .unsigned()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table.string("stripeIntentId").nullable().unique(); // Can be null if intent creation failed

    table
      .enu("status", [
        "created",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
      ])
      .defaultTo("failed");

    table.text("errorMessage").nullable();
    table.integer("retryAttempt").defaultTo(1);

    table.boolean("isRetried").defaultTo(false);
    table.timestamp("scheduledRetryAt").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("providerPaymentIntents", (table) => {
    table.increments("id").primary();

    table
      .integer("contractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table
      .integer("paymentProviderId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("paymentProviders")
      .onDelete("CASCADE");

    table.string("externalIntentId").notNullable().unique();

    table.decimal("amount", 10, 2).notNullable();

    table
      .enu("status", [
        "created",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
      ])
      .defaultTo("created");

    table.text("failureReason").nullable();

    table.integer("attemptCount").defaultTo(1);

    table.timestamp("createdAt").defaultTo(knex.fn.now());

    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("wallets", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("availableBalance", 10, 2).defaultTo(0);
    table.decimal("onHold", 10, 2).defaultTo(0);
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'walletTransactions' table...");
  await knex.schema.createTable("walletTransactions", (table) => {
    table.increments("id").primary();
    table
      .integer("walletId")
      .unsigned()
      .references("id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table
      .enu("type", [
        "credit",
        "debit",
        "hold",
        "release",
        "withdrawal",
        "refund",
      ])
      .notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.text("description").nullable();
    table
      .enu("source", ["manual", "contract", "job", "admin", "refund", "other"])
      .defaultTo("manual");
    table.integer("referenceId").nullable(); // e.g. contractId or jobId
    table.string("referenceType").nullable(); // "contract", "job", etc.
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'walletHoldLogs' table...");
  await knex.schema.createTable("walletHoldLogs", (table) => {
    table.increments("id").primary();
    table
      .integer("holdTransactionId")
      .unsigned()
      .references("id")
      .inTable("walletTransactions")
      .onDelete("CASCADE");
    table
      .integer("releaseTransactionId")
      .unsigned()
      .references("id")
      .inTable("walletTransactions")
      .onDelete("CASCADE");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'withdrawals' table...");
  await knex.schema.createTable("withdrawals", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("amount", 10, 2).notNullable();
    table
      .enu("status", ["pending", "processing", "completed", "failed"])
      .defaultTo("pending");
    table.string("method").nullable(); // e.g., "bank", "stripe", "paypal"
    table.text("notes").nullable();
    table.timestamp("requestedAt").defaultTo(knex.fn.now());
    table.timestamp("processedAt").nullable();
    table.timestamp("failedAt").nullable();
  });

  console.log("🔄 Creating 'jobDriverAssignments' table...");
  await knex.schema.createTable("jobDriverAssignments", (table) => {
    table.increments("id").primary();
    table
      .integer("jobApplicationId")
      .unsigned()
      .references("id")
      .inTable("jobApplications")
      .onDelete("CASCADE");
    table
      .integer("assignedByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .integer("driverId")
      .unsigned()
      .references("id")
      .inTable("drivers")
      .onDelete("CASCADE");
    table.timestamp("assignedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'userLocations' table...");
  await knex.schema.createTable("userLocations", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("latitude", 10, 6);
    table.decimal("longitude", 10, 6);
    table.timestamp("recordedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'jobTrackingLocations' table...");
  await knex.schema.createTable("jobTrackingLocations", (table) => {
    table.increments("id").primary();
    table
      .integer("jobApplicationId")
      .unsigned()
      .references("id")
      .inTable("jobApplications")
      .onDelete("CASCADE");
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("latitude", 10, 6);
    table.decimal("longitude", 10, 6);
    table.timestamp("recordedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'StripeAccounts' table...");
  await knex.schema.createTable("paymentAccounts", (table) => {
    table.increments("id").primary();

    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("providerId")
      .unsigned()
      .references("id")
      .inTable("paymentProviders")
      .onDelete("CASCADE");

    table.string("accountId").notNullable(); // Could be Stripe ID, PayPal email, etc.
    table.boolean("isVerified").defaultTo(false);

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());

    table.unique(["userId", "providerId"]); // one account per driver per provider
  });

  console.log("🔄 Creating 'StripePayments' table...");
  await knex.schema.createTable("jobPayments", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");

    table
      .integer("companyId")
      .unsigned()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");

    table
      .integer("providerId")
      .unsigned()
      .references("id")
      .inTable("paymentProviders")
      .onDelete("SET NULL");

    table.string("externalPaymentId").notNullable(); // paymentIntentId or PayPal txn ID
    table.decimal("baseAmount", 10, 2).notNullable();
    table.decimal("companyCommission", 10, 2).notNullable();
    table.decimal("driverCommission", 10, 2).notNullable();
    table.decimal("totalAmount", 10, 2).notNullable();

    table
      .enum("status", ["pending", "succeeded", "failed"])
      .defaultTo("pending");

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'StripeTransfers' table...");
  await knex.schema.createTable("jobTransfers", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");

    table
      .integer("driverId")
      .unsigned()
      .references("id")
      .inTable("drivers")
      .onDelete("CASCADE");

    table
      .integer("providerId")
      .unsigned()
      .references("id")
      .inTable("paymentProviders")
      .onDelete("SET NULL");

    table.string("externalTransferId").notNullable(); // payout/transfer ID
    table.decimal("amount", 10, 2).notNullable();
    table
      .enum("status", ["pending", "succeeded", "failed"])
      .defaultTo("pending");

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("userAddHistory", (table) => {
    table.increments("id").primary();
    table
      .integer("addedByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .integer("addedUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("companyId")
      .unsigned()
      .references("id")
      .inTable("companies")
      .onDelete("SET NULL");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("roleVisibilityPermissions", (table) => {
    table.increments("id").primary();
    table
      .integer("fromRoleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table
      .integer("visibleToRoleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("jobCancellations", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("cancelledByUserId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("reason");
    table.boolean("isTonuPaid").defaultTo(false);
    table.decimal("tonuAmount", 10, 2);
    table.timestamp("cancelledAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'contractTransactions' table...");
  await knex.schema.createTable("contractTransactions", (table) => {
    table.increments("id").primary();
    table
      .integer("contractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");
    table
      .integer("walletTransactionId")
      .unsigned()
      .references("id")
      .inTable("walletTransactions")
      .onDelete("SET NULL");
    table.decimal("amount", 10, 2);
    table.timestamp("billingCycleStart");
    table.timestamp("billingCycleEnd");
    table.enu("status", [
      "created",
      "processing",
      "succeeded",
      "failed",
      "cancelled",
    ]);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("✅ Created All tables");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Dropping all tables...");

  await knex.schema.dropTableIfExists("contractTransactions");
  await knex.schema.dropTableIfExists("jobCancellations");
  await knex.schema.dropTableIfExists("roleVisibilityPermissions");
  await knex.schema.dropTableIfExists("userAddHistory");
  await knex.schema.dropTableIfExists("jobTransfers");
  await knex.schema.dropTableIfExists("jobPayments");
  await knex.schema.dropTableIfExists("paymentAccounts");
  await knex.schema.dropTableIfExists("jobTrackingLocations");
  await knex.schema.dropTableIfExists("userLocations");
  await knex.schema.dropTableIfExists("jobDriverAssignments");
  await knex.schema.dropTableIfExists("withdrawals");
  await knex.schema.dropTableIfExists("walletHoldLogs");
  await knex.schema.dropTableIfExists("walletTransactions");
  await knex.schema.dropTableIfExists("wallets");
  await knex.schema.dropTableIfExists("providerPaymentIntents");
  await knex.schema.dropTableIfExists("contractPaymentFailures");
  await knex.schema.dropTableIfExists("contracts");
  await knex.schema.dropTableIfExists("jobApplications");
  await knex.schema.dropTableIfExists("jobVisibilityRoles");
  await knex.schema.dropTableIfExists("jobPostingFees");
  await knex.schema.dropTableIfExists("jobs");
  await knex.schema.dropTableIfExists("drivers");
  await knex.schema.dropTableIfExists("companyUsers");
  await knex.schema.dropTableIfExists("companies");
  await knex.schema.dropTableIfExists("companyTypes");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("userRoles");
  await knex.schema.dropTableIfExists("otpVerifications");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("paymentProviders");
  await knex.schema.dropTableIfExists("roles");

  console.log("✅ All tables dropped successfully.");
}
