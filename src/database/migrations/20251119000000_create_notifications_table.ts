import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'notifications' table...");
  
  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    
    table.string("type", 100).notNullable();
    table.string("title", 255).notNullable();
    table.text("message").notNullable();
    
    table.string("entityType", 50).nullable();
    table.integer("entityId").unsigned().nullable();
    
    table.boolean("read").defaultTo(false).notNullable();
    table.timestamp("readAt").nullable();
    
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
    
    // Indexes for better performance
    table.index("userId", "idx_notifications_user_id");
    table.index(["userId", "read"], "idx_notifications_user_read");
    table.index("createdAt", "idx_notifications_created_at");
    table.index("type", "idx_notifications_type");
    table.index(["entityType", "entityId"], "idx_notifications_entity");
  });

  console.log("✅ Notifications table created successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'notifications' table...");
  await knex.schema.dropTableIfExists("notifications");
  console.log("✅ Notifications table dropped successfully");
}

