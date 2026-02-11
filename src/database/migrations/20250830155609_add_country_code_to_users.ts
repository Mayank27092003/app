import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding countryCode to users table...");
  await knex.schema.alterTable("users", (table) => {
    table.string("phoneCountryCode").nullable().after("phoneNumber");
  });

  console.log("✅ Country code field added successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Removing countryCode from users table...");
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("phoneCountryCode");
  });

  console.log("✅ Country code field removed successfully");
}
