import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messageStatus", (table) => {
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deliveredAt").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messageStatus", (table) => {
    table.dropColumn("createdAt");
    table.dropColumn("updatedAt");
    table.dropColumn("deliveredAt");
  });
}
