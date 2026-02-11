import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL")
      .nullable()
      .comment("User who created the job");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table.dropColumn("userId");
  });
}
