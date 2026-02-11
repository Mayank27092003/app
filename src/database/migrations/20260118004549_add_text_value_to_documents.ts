import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding 'textValue' field to 'documents' table...");
  
  await knex.schema.alterTable("documents", (table) => {
    table.string("textValue", 500).nullable().comment("Text input value for document types that accept text input (e.g., SSN)");
  });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back textValue field...");

  await knex.schema.alterTable("documents", (table) => {
    table.dropColumn("textValue");
  });

  console.log("✅ Rollback complete.");
}

