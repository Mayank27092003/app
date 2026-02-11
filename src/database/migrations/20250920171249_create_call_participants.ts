import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("call_participants", (table) => {
    table.increments("id").primary();
    table.integer("callSessionId").notNullable().index();
    table.integer("userId").notNullable().index();
    table.timestamp("joinedAt").nullable();
    table.timestamp("leftAt").nullable();
    table.boolean("isMuted").notNullable().defaultTo(false);
    table.boolean("isVideoEnabled").notNullable().defaultTo(true);
    table.boolean("isScreenSharing").notNullable().defaultTo(false);
    table.enum("connectionQuality", ["excellent", "good", "fair", "poor"]).nullable();
    table.enum("networkType", ["wifi", "cellular", "ethernet", "unknown"]).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("callSessionId").references("id").inTable("call_sessions").onDelete("CASCADE");
    table.foreign("userId").references("id").inTable("users").onDelete("CASCADE");

    // Unique constraint to prevent duplicate participants
    table.unique(["callSessionId", "userId"]);

    // Indexes for performance
    table.index(["callSessionId", "joinedAt"]);
    table.index(["userId", "joinedAt"]);
    table.index(["isMuted", "isVideoEnabled"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("call_participants");
}
