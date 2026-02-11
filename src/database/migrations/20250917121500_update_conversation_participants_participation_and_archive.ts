import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    table.timestamp("leftAt").nullable();
    table.timestamp("archivedAt").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    table.dropColumn("leftAt");
    table.dropColumn("archivedAt");
  });
}


