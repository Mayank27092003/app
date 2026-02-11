import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("userLocations");
  await knex.schema.createTable("userLocations", (table) => {
    table.increments("id").primary();
    table.integer("userId").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.decimal("lat", 10, 7).notNullable();
    table.decimal("lng", 10, 7).notNullable();
    table.decimal("accuracy", 10, 2);
    table.decimal("heading", 10, 2);
    table.decimal("speed", 10, 2);
    table.string("provider");
    table.integer("battery");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.index(["userId", "createdAt"], "user_locations_user_created_idx");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("userLocations");
}


