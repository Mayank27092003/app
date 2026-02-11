import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding 'acceptsTextInput' field to 'documentTypes' table...");
  
  await knex.schema.alterTable("documentTypes", (table) => {
    table.boolean("acceptsTextInput").defaultTo(false).notNullable().comment("Whether this document type accepts text input instead of file upload (e.g., SSN, phone number)");
  });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back acceptsTextInput field...");

  await knex.schema.alterTable("documentTypes", (table) => {
    table.dropColumn("acceptsTextInput");
  });

  console.log("✅ Rollback complete.");
}

