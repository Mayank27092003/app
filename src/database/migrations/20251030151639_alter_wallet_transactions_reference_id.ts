import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('walletTransactions', (table) => {
    // Change referenceId to string and nullable
    table.string('referenceId').nullable().alter();
    table.enu('status', [
      "initial",
      "withdrawal_requested",
      "processing",
      "processed",
      "failed",
      "cancelled",
      "payout_pending" // NEW status
    ]).defaultTo("initial");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('walletTransactions', (table) => {
    // Down: convert back to integer, not nullable (data may be lost)
    table.integer('referenceId').notNullable().alter();
    table.dropColumn('status');
  });
}