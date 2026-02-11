// migrations/20250906123000_create_contracts_and_milestones.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop existing tables (milestones first)
  await knex.schema.dropTableIfExists("milestones");

  await knex.schema.alterTable("contracts", (table) => {
    table
      .integer("jobApplicationId")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("jobApplications")
      .onDelete("SET NULL");
    table.timestamp("nextBillingDate").nullable().alter();
  });

  await knex.schema.alterTable("jobApplications", (table) => {
    table
      .integer("conversationId")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("conversations") // or "threads" depending on your table name
      .onDelete("SET NULL");
  });

  // Create milestones table
  await knex.schema.createTable("milestones", (table) => {
    table.increments("id").primary();

    table
      .integer("contractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table.string("title").notNullable();
    table.text("description").nullable();
    table.decimal("amount", 10, 2).notNullable();

    table
      .enum("status", ["pending", "inProgress", "completed", "paid"])
      .notNullable()
      .defaultTo("pending");

    table.timestamp("dueDate").nullable();

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("milestones");
  await knex.schema.alterTable("jobApplications", (table) => {
    table.dropColumn("conversationId");
  });

  await knex.schema.alterTable("contracts", (table) => {
    table.dropColumn("jobApplicationId");
    table.timestamp("nextBillingDate").notNullable().alter();
  });
}
