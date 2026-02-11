import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Updating 'jobApplications' table...");
  
  await knex.schema.alterTable("jobApplications", (table) => {
    // Update status enum
    table.dropColumn("status");
  });

  await knex.schema.alterTable("jobApplications", (table) => {
    table
      .enu("status", ["pending", "accepted", "rejected", "withdrawn", "completed"])
      .notNullable()
      .defaultTo("pending");
  });

  // Add new columns
  await knex.schema.alterTable("jobApplications", (table) => {
    table.text("coverLetter").nullable();
    table.decimal("proposedRate", 10, 2).nullable();
    table.string("estimatedDuration", 100).nullable();
    table.text("notes").nullable();
    table.timestamp("acceptedAt").nullable();
    table.timestamp("rejectedAt").nullable();
    table.timestamp("withdrawnAt").nullable();
    table.text("rejectionReason").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("✅ 'jobApplications' table updated successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Reverting 'jobApplications' table...");
  
  await knex.schema.alterTable("jobApplications", (table) => {
    table.dropColumn("coverLetter");
    table.dropColumn("proposedRate");
    table.dropColumn("estimatedDuration");
    table.dropColumn("notes");
    table.dropColumn("acceptedAt");
    table.dropColumn("rejectedAt");
    table.dropColumn("withdrawnAt");
    table.dropColumn("rejectionReason");
    table.dropColumn("createdAt");
  });

  await knex.schema.alterTable("jobApplications", (table) => {
    table.dropColumn("status");
  });

  await knex.schema.alterTable("jobApplications", (table) => {
    table
      .enu("status", ["applied", "accepted", "cancelled", "completed"])
      .notNullable();
  });

  console.log("✅ 'jobApplications' table reverted successfully");
}
