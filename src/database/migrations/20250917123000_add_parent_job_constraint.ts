import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add constraint to prevent self-referencing parentJobId
  await knex.raw(`
    ALTER TABLE jobs 
    ADD CONSTRAINT check_parent_job_not_self 
    CHECK (id != "parentJobId")
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE jobs 
    DROP CONSTRAINT check_parent_job_not_self
  `);
}
