import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("call_sessions", (table) => {
    table.increments("id").primary();
    table.integer("callerId").notNullable().index();
    table.integer("conversationId").notNullable().index();
    table.enum("callType", ["audio", "video"]).notNullable();
    table.boolean("isGroupCall").notNullable().defaultTo(false);
    table.enum("status", [
      "initiating", 
      "ringing", 
      "connected", 
      "ended", 
      "declined", 
      "missed", 
      "busy"
    ]).notNullable().defaultTo("initiating");
    table.timestamp("startTime").nullable();
    table.timestamp("endTime").nullable();
    table.integer("duration").nullable().comment("Duration in seconds");
    table.enum("callQuality", ["excellent", "good", "fair", "poor"]).nullable();
    table.enum("networkType", ["wifi", "cellular", "ethernet", "unknown"]).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("callerId").references("id").inTable("users").onDelete("CASCADE");
    table.foreign("conversationId").references("id").inTable("conversations").onDelete("CASCADE");

    // Indexes for performance
    table.index(["callerId", "createdAt"]);
    table.index(["conversationId", "createdAt"]);
    table.index(["status", "createdAt"]);
    table.index(["callType", "createdAt"]);
    table.index(["isGroupCall", "createdAt"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("call_sessions");
}
