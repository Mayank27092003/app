import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    // Add role column
    table
      .enum("role", ["admin", "member", "support"])
      .notNullable()
      .defaultTo("member");

    // Add joinedByUserId column
    table
      .integer("joinedByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL")
      .nullable();
  });
  await knex.schema.alterTable("jobs", (table) => {
    table.dropColumn("status");
  });

  // 2. Create a new named enum type
  await knex.raw(`
    CREATE TYPE jobs_status_check AS ENUM (
      'draft',
      'active',
      'assigned',
      'in_progress',
      'completed',
      'cancelled',
      'partially_completed'
    )
  `);

  // 3. Add new status column with the updated enum
  await knex.schema.alterTable("jobs", (table) => {
    table
      .enu(
        "status",
        [
          "draft",
          "active",
          "assigned",
          "in_progress",
          "completed",
          "cancelled",
          "partially_completed",
        ]
          )
      .defaultTo("active")
      .notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversationParticipants", (table) => {
    table.dropColumn("role");
    table.dropColumn("joinedByUserId");
  });
}
