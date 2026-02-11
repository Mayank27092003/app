// migrations/20250906150000_create_contract_participants.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop if already exists (for dev safety)
  await knex.schema.dropTableIfExists("contractParticipantHistory");
  await knex.schema.dropTableIfExists("contractParticipants");

  // Main participants table
  await knex.schema.createTable("contractParticipants", (table) => {
    table.increments("id").primary();

    table
      .integer("contractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .enum("role", ["driver", "broker", "shipper", "carrier", "admin", "support"])
      .notNullable();

    table
      .enum("status", ["active", "removed", "invited"])
      .notNullable()
      .defaultTo("active");

    table.timestamp("joinedAt").defaultTo(knex.fn.now());
    table.timestamp("removedAt").nullable();

    table.integer("addedByUserId").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.integer("removedByUserId").unsigned().references("id").inTable("users").onDelete("SET NULL");

    table.text("reasonForChange").nullable();
    table.text("notes").nullable();

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  // History/audit log table
  await knex.schema.createTable("contractParticipantHistory", (table) => {
    table.increments("id").primary();

    table
      .integer("contractParticipantId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contractParticipants")
      .onDelete("CASCADE");

    table
      .enum("action", ["added", "removed", "roleChanged", "statusChanged"])
      .notNullable();

    table.integer("changedByUserId").unsigned().references("id").inTable("users").onDelete("SET NULL");

    table.jsonb("oldValue").nullable();
    table.jsonb("newValue").nullable();
    table.text("reason").nullable();

    table.timestamp("changedAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("contractParticipantHistory");
  await knex.schema.dropTableIfExists("contractParticipants");
}
