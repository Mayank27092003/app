import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "profileImage");
  if (!hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.string("profileImage").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "profileImage");
  if (hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn("profileImage");
    });
  }
}


