import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'rolePostingPermissions' table...");
  await knex.schema.createTable("rolePostingPermissions", (table) => {
    table.increments("id").primary();

    table
      .integer("posterRoleId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");

    table
      .integer("viewerRoleId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");

    table.unique(["posterRoleId", "viewerRoleId"], "unique_poster_viewer");

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  console.log("✅ 'rolePostingPermissions' table created successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'rolePostingPermissions' table...");
  await knex.schema.dropTableIfExists("rolePostingPermissions");
  console.log("✅ Dropped 'rolePostingPermissions'");
}
