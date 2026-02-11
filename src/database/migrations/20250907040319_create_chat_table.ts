import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.boolean("isSystem").notNullable().defaultTo(false);
    table
      .enu("messageType", ["text", "image", "video", "file"], {
        useNative: true,
        enumName: "message_type_enum",
      })
      .notNullable()
      .defaultTo("text");
  });

  await knex.schema.alterTable("conversations", (table) => {
    table
      .integer("lastMessageId")
      .unsigned()
      .references("id")
      .inTable("messages")
      .onDelete("SET NULL")
      .nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.dropColumn("isSystem");
    table.dropColumn("messageType");
  });

  await knex.raw(`DROP TYPE IF EXISTS message_type_enum`);

  await knex.schema.alterTable("conversations", (table) => {
    table.dropColumn("lastMessageId");
  });
}
