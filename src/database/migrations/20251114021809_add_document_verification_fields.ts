import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding verification fields to 'documents' table...");
  
  await knex.schema.alterTable("documents", (table) => {
    table.timestamp("verifiedAt").nullable();
    table.timestamp("rejectedAt").nullable();
    table
      .integer("verifiedBy")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .integer("rejectedBy")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.text("rejectionReason").nullable();
  });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back document verification fields...");

  await knex.schema.alterTable("documents", (table) => {
    table.dropColumn("verifiedAt");
    table.dropColumn("rejectedAt");
    table.dropColumn("verifiedBy");
    table.dropColumn("rejectedBy");
    table.dropColumn("rejectionReason");
  });

  console.log("✅ Rollback complete.");
}

