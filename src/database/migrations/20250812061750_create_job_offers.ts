import type { Knex } from "knex";

// migrations/20250812_create_job_offers.js
export async function up(knex: Knex): Promise<void> {
  console.log("🚀 Running UP migration: creating Job Offers...");

  await knex.schema.createTable("job_offers", (table) => {
    table.increments("id").primary();
    table
      .integer("job_id")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("from_user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("to_user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .enu("status", ["pending", "accepted", "declined"])
      .defaultTo("pending");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("job_offers");
}
