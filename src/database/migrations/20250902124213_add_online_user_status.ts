import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🚀 Running UP migration: Adding online user status...");

  // Create user_sessions table for tracking online status
  await knex.schema.createTable("user_sessions", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("sessionId").notNullable().unique();
    table.string("socketId").notNullable();
    table.string("userAgent");
    table.string("ipAddress");
    table.timestamp("lastSeen").defaultTo(knex.fn.now());
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(["userId"]);
    table.index(["sessionId"]);
    table.index(["socketId"]);
    table.index(["lastSeen"]);
  });

  // Create user_online_status table for quick online status lookup
  await knex.schema.createTable("user_online_status", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.boolean("isOnline").defaultTo(false);
    table.timestamp("lastOnline").defaultTo(knex.fn.now());
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    
    // Unique constraint on userId
    table.unique(["userId"]);
    table.index(["isOnline"]);
    table.index(["lastOnline"]);
  });

  console.log("✅ Created user_sessions and user_online_status tables");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🧨 Rolling back: Dropping user_sessions and user_online_status tables...");
  
  await knex.schema.dropTableIfExists("user_online_status");
  await knex.schema.dropTableIfExists("user_sessions");
  
  console.log("✅ Migration DOWN complete.");
}
