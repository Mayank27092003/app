import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contracts", (table) => {
    table
      .integer("parentContractId")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("contracts")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contracts", (table) => {
    table.dropColumn("parentContractId");
  });
}

