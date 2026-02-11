import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding phone number to users table...");
  await knex.schema.alterTable("users", (table) => {
    table.string("phoneNumber").nullable().after("password");
  });

  console.log("🔄 Adding location fields to companies table...");
  await knex.schema.alterTable("companies", (table) => {
    table.string("phoneNumber").nullable().after("contactNumber");
    table.string("address").nullable().after("phoneNumber");
    table.string("country").nullable().after("address");
    table.string("state").nullable().after("country");
    table.string("city").nullable().after("state");
    table.string("zipCode").nullable().after("city");
  });

  console.log("✅ Phone number and location fields added successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Removing location fields from companies table...");
  await knex.schema.alterTable("companies", (table) => {
    table.dropColumn("zipCode");
    table.dropColumn("city");
    table.dropColumn("state");
    table.dropColumn("country");
    table.dropColumn("address");
    table.dropColumn("phoneNumber");
  });

  console.log("🔄 Removing phone number from users table...");
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("phoneNumber");
  });

  console.log("✅ Phone number and location fields removed successfully");
}
