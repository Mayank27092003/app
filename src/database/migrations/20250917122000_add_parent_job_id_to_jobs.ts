import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table
      .integer("parentJobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("SET NULL")
      .nullable();
  });

  // Add index for efficient querying of job chains
  await knex.schema.alterTable("jobs", (table) => {
    table.index(["parentJobId", "createdAt"], "idx_jobs_parent_created");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("jobs", (table) => {
    table.dropIndex(["parentJobId", "createdAt"], "idx_jobs_parent_created");
    table.dropColumn("parentJobId");
  });
}
