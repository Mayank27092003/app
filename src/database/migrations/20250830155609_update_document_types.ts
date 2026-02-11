import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding displayName column to documentTypes...");

  await knex.schema.alterTable("documentTypes", (table) => {
    table.string("displayName").nullable();
  });

  console.log("✅ displayName column added and populated!");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏪ Dropping displayName column from documentTypes...");
  await knex.schema.alterTable("documentTypes", (table) => {
    table.dropColumn("displayName");
  });
  console.log("✅ displayName column dropped!");
}
