import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🚀 Running UP migration: updating Jobs table...");

  // Create escrows table
  await knex.schema.createTable("escrows", (table) => {
    table.increments("id").primary();
    table
      .integer("contractId")
      .unsigned()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");
    table.decimal("amount", 10, 2).notNullable();
    table
      .enu("status", ["pending", "released", "refunded"])
      .defaultTo("pending");
    table.timestamps(true, true);
  });

  // Alter wallet_transactions for refund tracking
  await knex.schema.alterTable("walletTransactions", (table) => {
    table
      .integer("escrow_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("escrows")
      .onDelete("SET NULL");
  });

  await knex.schema.createTable("roleCategories", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.string("description");
    table.timestamps(true, true);
  });

  await knex.schema.alterTable("roles", (table) => {
    table
      .integer("categoryId")
      .unsigned()
      .references("id")
      .inTable("roleCategories")
      .onDelete("SET NULL");
  });
  await knex.schema.table("companyTypes", (table) => {
    table
      .integer("roleCategoryId")
      .unsigned()
      .references("id")
      .inTable("roleCategories")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  console.log("🚀 Running Down migration: updating Jobs table...");
  await knex.schema.table("companyTypes", (table) => {
    table.dropColumn("roleCategoryId");
  });

  await knex.schema.alterTable("roles", (table) => {
    table.dropColumn("categoryId");
  });
  await knex.schema.dropTableIfExists("roleCategories");

  await knex.schema.alterTable("walletTransactions", (table) => {
    table.dropColumn("escrowId");
  });

  await knex.schema.dropTableIfExists("escrows");
}
