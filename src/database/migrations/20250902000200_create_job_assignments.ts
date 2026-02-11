import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'jobAssignments' table...");
  await knex.schema.createTable("jobAssignments", (table) => {
    table.increments("id").primary();
    
    table
      .integer("jobId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    
    table
      .integer("driverId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("drivers")
      .onDelete("CASCADE");
    
    table
      .integer("assignedByCompanyId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");
    
    table
      .enu("assignmentType", ["auto", "manual", "direct"])
      .notNullable()
      .comment("auto: system assigned, manual: admin assigned, direct: direct assignment");
    
    table
      .enu("status", ["pending", "accepted", "rejected", "started", "completed", "cancelled"])
      .notNullable()
      .defaultTo("pending");
    
    table.timestamp("assignedAt").nullable();
    table.timestamp("acceptedAt").nullable();
    table.timestamp("startedAt").nullable();
    table.timestamp("completedAt").nullable();
    table.timestamp("cancelledAt").nullable();
    table.text("notes").nullable();
    
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
    
    // Indexes
    table.index("jobId");
    table.index("driverId");
    table.index("assignedByCompanyId");
    table.index("status");
    table.index("assignmentType");
  });

  console.log("✅ 'jobAssignments' table created successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'jobAssignments' table...");
  await knex.schema.dropTableIfExists("jobAssignments");
  console.log("✅ Dropped 'jobAssignments'");
}
