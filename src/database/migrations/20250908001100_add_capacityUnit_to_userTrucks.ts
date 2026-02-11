import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("userTrucks", "capacityUnit");
  if (!hasColumn) {
    await knex.schema.alterTable("userTrucks", (table) => {
      table
        .enu("capacityUnit", ["ft", "tons", "lbs", "kg", "m3", "other"], {
          useNative: false,
          enumName: "userTrucks_capacityUnit",
        })
        .notNullable()
        .defaultTo("ft");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("userTrucks", "capacityUnit");
  if (hasColumn) {
    await knex.schema.alterTable("userTrucks", (table) => {
      table.dropColumn("capacityUnit");
    });
  }
}


