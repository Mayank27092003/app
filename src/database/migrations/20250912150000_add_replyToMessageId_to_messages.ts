import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.integer("replyToMessageId").unsigned().nullable().references("id").inTable("messages").onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.dropIndex(["replyToMessageId"], "idx_messages_replyToMessageId");
    table.dropColumn("replyToMessageId");
  });
}
