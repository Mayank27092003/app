import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (table) => {
    table.dropColumn("isArchived");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (table) => {
    table.boolean("isArchived").defaultTo(false);
  });
}
