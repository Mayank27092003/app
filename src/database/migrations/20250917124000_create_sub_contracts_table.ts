import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("subContracts", (table) => {
    table.increments("id").primary();

    table
      .integer("rootContractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table
      .integer("parentContractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table
      .integer("subContractId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contracts")
      .onDelete("CASCADE");

    table
      .integer("resharedJobId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");

    table.decimal("splitPercentage", 5, 2).notNullable(); // e.g., 70.00 for 70%
    table.decimal("splitAmount", 10, 2).notNullable();    // calculated split amount

      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());

    // Unique: prevent multiple sub-contracts for same parent+reshared job

    // Prevent self-referencing

  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("subContracts");
}
