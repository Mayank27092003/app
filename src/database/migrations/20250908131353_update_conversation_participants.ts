import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    // Drop old role column
    table.dropColumn("role");
  });

  await knex.schema.alterTable("conversationParticipants", (table) => {
    // Add role column again with updated enum
    table
      .enum("role", ["admin", "member", "support", "driver"])
      .notNullable()
      .defaultTo("member");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    // Drop the new role column
    table.dropColumn("role");
  });

  await knex.schema.alterTable("conversationParticipants", (table) => {
    // Restore old role column without driver
    table
      .enum("role", ["admin", "member", "support"])
      .notNullable()
      .defaultTo("member");
  });
}
