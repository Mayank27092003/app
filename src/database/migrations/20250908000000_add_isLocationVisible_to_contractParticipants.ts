import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("contractParticipants", "isLocationVisible");
  if (!hasColumn) {
    await knex.schema.alterTable("contractParticipants", (table) => {
      table.boolean("isLocationVisible").nullable().defaultTo(null);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("contractParticipants", "isLocationVisible");
  if (hasColumn) {
    await knex.schema.alterTable("contractParticipants", (table) => {
      table.dropColumn("isLocationVisible");
    });
  }
}


