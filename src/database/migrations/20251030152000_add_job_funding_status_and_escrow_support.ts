import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add pending_funding status to jobs enum
  await knex.raw(`
    ALTER TABLE "jobs"
    DROP CONSTRAINT IF EXISTS "jobs_status_check";
    
    ALTER TABLE "jobs"
    ADD CONSTRAINT "jobs_status_check" 
    CHECK (status IN ('draft', 'pending_funding', 'active', 'assigned', 'in_progress', 'completed', 'cancelled'));
  `);

  // Add jobId to escrows table (nullable, since escrows can be for contracts OR jobs)
  await knex.schema.alterTable("escrows", (table) => {
    table
      .integer("jobId")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");

    // Make contractId nullable (since escrow can be for job OR contract)
    table.integer("contractId").nullable().alter();
  });

  // Update escrow status enum to include "held"
  await knex.raw(`
    ALTER TABLE "escrows"
    DROP CONSTRAINT IF EXISTS "escrows_status_check";
    
    ALTER TABLE "escrows"
    ADD CONSTRAINT "escrows_status_check" 
    CHECK (status IN ('pending', 'held', 'released', 'refunded'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove jobId from escrows
  await knex.schema.alterTable("escrows", (table) => {
    table.dropColumn("jobId");
    table.integer("contractId").notNullable().alter();
  });

  // Revert job status enum (remove pending_funding)
  await knex.raw(`
    ALTER TABLE "jobs"
    DROP CONSTRAINT IF EXISTS "jobs_status_check";
    
    ALTER TABLE "jobs"
    ADD CONSTRAINT "jobs_status_check" 
    CHECK (status IN ('draft', 'active', 'assigned', 'in_progress', 'completed', 'cancelled'));
  `);

  // Revert escrow status enum
  await knex.raw(`
    ALTER TABLE "escrows"
    DROP CONSTRAINT IF EXISTS "escrows_status_check";
    
    ALTER TABLE "escrows"
    ADD CONSTRAINT "escrows_status_check" 
    CHECK (status IN ('pending', 'released', 'refunded'));
  `);
}
