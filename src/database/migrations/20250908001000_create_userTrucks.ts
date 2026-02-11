import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("userTrucks");
  if (!exists) {
    await knex.schema.createTable("userTrucks", (table) => {
      table.increments("id").primary();
      table.integer("userId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
      table.integer("truckTypeId").unsigned().notNullable().references("id").inTable("truckTypes").onDelete("RESTRICT");
      table.string("capacity").notNullable(); // e.g., "20 tons", "40 ft"
      table.string("label").nullable(); // Friendly name: "Blue Freightliner", "Reefer #2"
      table.boolean("isPrimary").notNullable().defaultTo(false);
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("userTrucks");
  if (exists) {
    await knex.schema.dropTable("userTrucks");
  }
}


