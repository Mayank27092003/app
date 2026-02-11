import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding 'side' field to 'documents' table...");
  
  await knex.schema.alterTable("documents", (table) => {
    table.string("side", 10).nullable().comment("Document side: 'front' or 'back' for documents that require both sides");
  });

  console.log("🔄 Adding 'requiresSides' field to 'documentTypes' table...");
  
  await knex.schema.alterTable("documentTypes", (table) => {
    table.boolean("requiresSides").defaultTo(false).comment("Whether this document type requires both front and back sides");
  });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back document side support...");

  await knex.schema.alterTable("documents", (table) => {
    table.dropColumn("side");
  });

  await knex.schema.alterTable("documentTypes", (table) => {
    table.dropColumn("requiresSides");
  });

  console.log("✅ Rollback complete.");
}

