import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'userFcmTokens' table...");
  await knex.schema.createTable("userFcmTokens", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    
    table.string("fcmToken").notNullable();
    table.string("deviceId").nullable(); // Optional device identifier
    table.string("deviceType").nullable(); // e.g., "android", "ios", "web"
    table.string("deviceName").nullable(); // e.g., "iPhone 12", "Samsung Galaxy"
    table.boolean("isActive").defaultTo(true).notNullable();
    table.timestamp("lastUsedAt").nullable();
    
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();

    // Indexes for better performance
    table.index("userId", "idx_user_fcm_tokens_user_id");
    table.index("fcmToken", "idx_user_fcm_tokens_fcm_token");
    table.index("deviceId", "idx_user_fcm_tokens_device_id");
    table.index("isActive", "idx_user_fcm_tokens_active");
    
    // Unique constraint to prevent duplicate tokens for same user and device
    table.unique(["userId", "deviceId"], "unique_user_device");
  });

  console.log("✅ FCM tokens table created successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'userFcmTokens' table...");
  await knex.schema.dropTableIfExists("userFcmTokens");
  console.log("✅ FCM tokens table dropped successfully");
}
