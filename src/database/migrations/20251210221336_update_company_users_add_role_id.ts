import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Updating 'companyUsers' table: replacing roleInCompany with roleId...");
  
  // Drop the old roleInCompany column
  await knex.schema.alterTable("companyUsers", (table) => {
    table.dropColumn("roleInCompany");
  });

  // Add the new roleId column with foreign key reference
  await knex.schema.alterTable("companyUsers", (table) => {
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("SET NULL")
      .nullable();
  });

  console.log("✅ Updated 'companyUsers' table: roleInCompany removed, roleId added");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Rolling back 'companyUsers' table changes...");
  
  // Remove the roleId column
  await knex.schema.alterTable("companyUsers", (table) => {
    table.dropColumn("roleId");
  });

  // Restore the old roleInCompany column
  await knex.schema.alterTable("companyUsers", (table) => {
    table.string("roleInCompany").defaultTo("member");
  });

  console.log("✅ Rolled back 'companyUsers' table: roleId removed, roleInCompany restored");
}

