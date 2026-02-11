import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding 'status' field to 'documents' table...");
  
  await knex.schema.alterTable("documents", (table) => {
    table.string("status", 20).defaultTo("uploaded").notNullable().comment("Document status: uploaded, submitted, pending, verified, rejected, expired");
  });

  // Update existing documents to have appropriate status
  // If verified, set to verified; if rejected, set to rejected; otherwise set to pending
  await knex("documents")
    .where("verified", true)
    .update({ status: "verified" });

  await knex("documents")
    .whereNotNull("rejectedAt")
    .update({ status: "rejected" });

  await knex("documents")
    .where("verified", false)
    .whereNull("rejectedAt")
    .update({ status: "pending" });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back document status field...");

  await knex.schema.alterTable("documents", (table) => {
    table.dropColumn("status");
  });

  console.log("✅ Rollback complete.");
}

