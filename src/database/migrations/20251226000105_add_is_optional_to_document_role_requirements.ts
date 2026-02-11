import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding 'isOptional' field to 'documentTypeRoleRequirements' table...");
  
  await knex.schema.alterTable("documentTypeRoleRequirements", (table) => {
    table.boolean("isOptional").defaultTo(false).notNullable().comment("Whether this document is optional for the role (false = required, true = optional)");
  });

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back isOptional field...");

  await knex.schema.alterTable("documentTypeRoleRequirements", (table) => {
    table.dropColumn("isOptional");
  });

  console.log("✅ Rollback complete.");
}

