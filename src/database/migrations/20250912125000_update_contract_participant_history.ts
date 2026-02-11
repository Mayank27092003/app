import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add userId column to preserve user information even when participant is deleted
  await knex.schema.alterTable("contractParticipantHistory", (table) => {
    table.integer("userId").unsigned().references("id").inTable("users").onDelete("CASCADE");
  });

  // Make contractParticipantId nullable to handle deleted participants
  await knex.schema.alterTable("contractParticipantHistory", (table) => {
    table.integer("contractParticipantId").nullable().alter();
  });

  // Update existing records to populate userId from the participant record
  await knex.raw(`
    UPDATE "contractParticipantHistory" 
    SET "userId" = (
      SELECT "userId" 
      FROM "contractParticipants" 
      WHERE "contractParticipants"."id" = "contractParticipantHistory"."contractParticipantId"
    )
    WHERE "contractParticipantId" IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove userId column
  await knex.schema.alterTable("contractParticipantHistory", (table) => {
    table.dropColumn("userId");
  });

  // Make contractParticipantId not nullable again
  await knex.schema.alterTable("contractParticipantHistory", (table) => {
    table.integer("contractParticipantId").notNullable().alter();
  });
}
