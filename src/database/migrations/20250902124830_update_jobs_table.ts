import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table.jsonb("cargo").nullable();
    table.text("specialRequirements").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table.dropColumn("cargo");
    table.dropColumn("specialRequirements");
  });
}
