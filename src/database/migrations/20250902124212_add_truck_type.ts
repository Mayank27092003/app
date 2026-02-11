import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("truckTypes", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.string("translationKey").notNullable().unique(); // for i18n lookups
    table.integer("sortIndex").notNullable().defaultTo(0);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("truckTypes");
}
