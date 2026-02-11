import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add message action fields
  await knex.schema.alterTable("messages", (table) => {
    table.boolean("isEdited").notNullable().defaultTo(false);
    table.boolean("isDeleted").notNullable().defaultTo(false);
    table.timestamp("editedAt").nullable();
    table.timestamp("deletedAt").nullable();
    table.string("fileType").nullable(); // 👈 new field for specific file type (pdf, doc, audio, video, etc.)
    table.string("fileUrl").nullable();
    table.string("fileName").nullable();
    table.string("fileSize").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove message action fields
  await knex.schema.alterTable("messages", (table) => {
    table.dropColumn("isEdited");
    table.dropColumn("isDeleted");
    table.dropColumn("editedAt");
    table.dropColumn("deletedAt");
    table.dropColumn("fileType");
  });
}
