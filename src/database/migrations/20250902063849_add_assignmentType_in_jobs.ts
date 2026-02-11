import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table
      .enum("assignmentType", ["auto", "manual"])
      .notNullable()
      .defaultTo("auto");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table.dropColumn("assignmentType");
  });
}
