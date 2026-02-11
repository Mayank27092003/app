import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add platformCommissionAmount to roleCommissions table
  await knex.schema.alterTable("roleCommissions", (table) => {
    table.decimal("platformCommissionAmount", 10, 2).nullable().comment("Fixed commission amount (used when commissionType is 'fixed_amount')");
  });

  // Add commissionType to roleCommissions table
  await knex.schema.alterTable("roleCommissions", (table) => {
    table.enum("commissionType", ["percentage", "fixed_amount"]).nullable().defaultTo("percentage").comment("Type of commission: percentage or fixed amount");
  });

  console.log("✅ Added fixed commission fields to roleCommissions table");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("roleCommissions", (table) => {
    table.dropColumn("platformCommissionAmount");
    table.dropColumn("commissionType");
  });

  console.log("✅ Removed fixed commission fields from roleCommissions table");
}

