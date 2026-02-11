import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable("StripePayments");
  
  if (!hasTable) {
    await knex.schema.createTable("StripePayments", (table) => {
      table.increments("id").primary();
      table
        .integer("jobId")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("jobs")
        .onDelete("CASCADE");

      table
        .integer("companyId")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("companies")
        .onDelete("CASCADE");

      table.decimal("baseAmount", 10, 2).notNullable();
      table.decimal("companyCommission", 10, 2).notNullable();
      table.decimal("driverCommission", 10, 2).notNullable();
      table.decimal("totalAmount", 10, 2).notNullable();
      table.string("stripePaymentIntentId").notNullable();

      table
        .enum("status", ["pending", "succeeded", "failed"])
        .defaultTo("pending")
        .notNullable();

      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());

      // Indexes for better query performance
      table.index("jobId");
      table.index("companyId");
      table.index("stripePaymentIntentId");
      table.index("status");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("StripePayments");
}

