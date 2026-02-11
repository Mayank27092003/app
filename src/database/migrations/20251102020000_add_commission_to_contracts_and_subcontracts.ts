import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🚀 Adding commission and date fields to contracts table...");

  // Add commission and date tracking fields to contracts table
  await knex.schema.alterTable("contracts", (table) => {
    // Commission fields
    table
      .decimal("platformCommissionPercent", 5, 2)
      .nullable()
      .comment("Platform commission percentage based on role and billing cycle");
    
    table
      .decimal("platformCommissionAmount", 10, 2)
      .nullable()
      .defaultTo(0)
      .comment("Total platform commission amount deducted (calculated based on days worked)");
    
    table
      .enum("commissionType", ["percentage", "fixed_amount"])
      .nullable()
      .comment("Type of commission: percentage or fixed_amount");
    
    // Date fields for calculating days worked
    table
      .timestamp("startDate")
      .nullable()
      .comment("Contract start date (when contract becomes active)");
    
    table
      .timestamp("endDate")
      .nullable()
      .comment("Contract end date (when contract is completed)");
  });

  console.log("🚀 Adding commission fields to subContracts table...");

  // Add commission fields to subContracts table
  await knex.schema.alterTable("subContracts", (table) => {
    table
      .decimal("platformCommissionPercent", 5, 2)
      .nullable()
      .comment("Platform commission percentage for this subcontract");
    
    table
      .decimal("platformCommissionAmount", 10, 2)
      .nullable()
      .defaultTo(0)
      .comment("Platform commission amount deducted for this subcontract");
    
    table
      .enum("commissionType", ["percentage", "fixed_amount"])
      .nullable()
      .comment("Type of commission: percentage or fixed_amount");
  });

  console.log("✅ Added commission fields to contracts and subContracts tables");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contracts", (table) => {
    table.dropColumn("platformCommissionPercent");
    table.dropColumn("platformCommissionAmount");
    table.dropColumn("commissionType");
    table.dropColumn("startDate");
    table.dropColumn("endDate");
  });

  await knex.schema.alterTable("subContracts", (table) => {
    table.dropColumn("platformCommissionPercent");
    table.dropColumn("platformCommissionAmount");
    table.dropColumn("commissionType");
  });
}

