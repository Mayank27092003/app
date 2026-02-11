import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("jobInvites", (table) => {
    table.increments("id").primary();

    table
      .integer("jobId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");

    table
      .integer("invitedUserId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("invitedByUserId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .enum("status", ["invited", "accepted", "declined"])
      .notNullable()
      .defaultTo("invited");

    table.text("message").nullable();
    table.text("declineReason").nullable();

    table.timestamp("invitedAt").defaultTo(knex.fn.now());
    table.timestamp("respondedAt").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());

    // Ensure one invite per job per user
    table.unique(["jobId", "invitedUserId"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("jobInvites");
}

