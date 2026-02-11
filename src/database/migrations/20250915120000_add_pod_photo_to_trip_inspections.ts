import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("tripInspections");
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn("tripInspections", "podPhoto");
  if (hasColumn) return;
  await knex.schema.alterTable("tripInspections", (table) => {
    table.jsonb("podPhoto");
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("tripInspections");
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn("tripInspections", "podPhoto");
  if (!hasColumn) return;
  await knex.schema.alterTable("tripInspections", (table) => {
    table.dropColumn("podPhoto");
  });
}


