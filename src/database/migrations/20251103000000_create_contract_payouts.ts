import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🚀 Creating 'contractPayouts' table...");

  await knex.schema.createTable("contractPayouts", (table) => {
    table.increments("id").primary();
    table
      .integer("contractId")
      .unsigned()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE")
      .notNullable();

    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .notNullable()
      .comment("User who should receive this payout");

    table
      .decimal("amount", 10, 2)
      .notNullable()
      .comment("Amount to be paid out (after deductions)");

    table
      .enum("status", ["pending", "transferring", "transferred", "failed"])
      .defaultTo("pending")
      .notNullable()
      .comment("Payout status");

    table
      .string("stripeTransferId")
      .nullable()
      .comment("Stripe Transfer ID when transfer is created");

    table
      .string("stripePayoutId")
      .nullable()
      .comment("Stripe Payout ID if using payouts API");

    table
      .text("errorMessage")
      .nullable()
      .comment("Error message if transfer failed");

    table
      .integer("walletTransactionId")
      .unsigned()
      .references("id")
      .inTable("walletTransactions")
      .onDelete("SET NULL")
      .nullable()
      .comment("Wallet transaction created when payout is completed");

    table
      .timestamp("transferredAt")
      .nullable()
      .comment("When the payout was successfully transferred");

    table.timestamp("createdAt").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updatedAt").defaultTo(knex.fn.now()).notNullable();

    // Indexes for better query performance
    table.index("contractId");
    table.index("userId");
    table.index("status");
    table.index("stripeTransferId");
  });

  console.log("✅ Created 'contractPayouts' table");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'contractPayouts' table...");
  await knex.schema.dropTableIfExists("contractPayouts");
  console.log("✅ Dropped 'contractPayouts' table");
}

