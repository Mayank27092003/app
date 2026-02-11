import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'documentTypes' table...");
  await knex.schema.createTable("documentTypes", (table) => {
    table.increments("id").primary();
    table.string("name").unique().notNullable();
    table.string("description").nullable();
    table.boolean("requiresExpiry").defaultTo(true);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'documentTypeRoleRequirements' table...");
  await knex.schema.createTable("documentTypeRoleRequirements", (table) => {
    table.increments("id").primary();
    table
      .integer("documentTypeId")
      .unsigned()
      .references("id")
      .inTable("documentTypes")
      .onDelete("CASCADE");
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table.integer("sortOrder").defaultTo(0);
  });

  console.log("🔄 Creating 'documents' table...");
  await knex.schema.createTable("documents", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("documentTypeId")
      .unsigned()
      .references("id")
      .inTable("documentTypes")
      .onDelete("CASCADE");
    table.string("fileUrl").notNullable();
    table.timestamp("expiryDate").nullable();
    table.boolean("verified").defaultTo(false);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });

  console.log("🔄 Creating 'conversations' table...");
  await knex.schema.createTable("conversations", (table) => {
    table.increments("id").primary();
    table
      .enum("chatType", ["direct", "group"])
      .notNullable()
      .defaultTo("direct");
    table.string("title").nullable(); // group chat title
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("SET NULL");
    table
      .integer("createdByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.boolean("isArchived").defaultTo(false);
    table.timestamp("lastMessageAt").defaultTo(knex.fn.now());
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'conversationParticipants' table...");
  await knex.schema.createTable("conversationParticipants", (table) => {
    table.increments("id").primary();
    table
      .integer("conversationId")
      .unsigned()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("joinedAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'messages' table...");
  await knex.schema.createTable("messages", (table) => {
    table.increments("id").primary();
    table
      .integer("conversationId")
      .unsigned()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table
      .integer("senderUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("content").notNullable();
    table.timestamp("sentAt").defaultTo(knex.fn.now());
  });

  console.log("🔄 Creating 'messageStatus' table...");
  await knex.schema.createTable("messageStatus", (table) => {
    table.increments("id").primary();
    table
      .integer("messageId")
      .unsigned()
      .references("id")
      .inTable("messages")
      .onDelete("CASCADE");
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.boolean("isRead").defaultTo(false);
    table.boolean("isDelivered").defaultTo(true);
    table.timestamp("readAt").nullable();
  });

  console.log("🔄 Creating 'reviews' table...");
  await knex.schema.createTable("reviews", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("reviewerUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("revieweeUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("rating").notNullable(); // 1–5
    table.text("comment").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("jobPhotos", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("driverId")
      .unsigned()
      .references("id")
      .inTable("drivers")
      .onDelete("CASCADE");
    table.enum("type", ["pre_trip", "post_trip"]).notNullable();
    table.string("photoUrl").notNullable();
    table.string("description").nullable(); // Optional comment e.g. “Tires in good shape”
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("disputes", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("raisedByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .enum("status", ["open", "in_review", "resolved", "rejected"])
      .defaultTo("open");
    table.text("reason").notNullable();
    table.timestamp("resolvedAt").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("jobDocuments", (table) => {
    table.increments("id").primary();
    table
      .integer("jobId")
      .unsigned()
      .references("id")
      .inTable("jobs")
      .onDelete("CASCADE");
    table
      .integer("uploadedByUserId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("documentType").defaultTo("bol"); // or "invoice", etc.
    table.string("fileUrl").notNullable();
    table.timestamp("uploadedAt").defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("roleCommissions", (table) => {
    table.increments("id").primary();
    
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
  
    table.enu("billingCycle", ["hourly", "weekly", "monthly"]).notNullable();
  
    table.decimal("platformCommissionPercent", 5, 2).notNullable(); // e.g. 10.00 for 10%
    
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });
  

  console.log("✅ Migration complete.");
}

export async function down(knex: Knex): Promise<void> {
  console.log("⏬ Rolling back all tables...[20250620091637_create_document_and_chat_tables.ts]");

  await knex.schema.dropTableIfExists("roleCommissions");
  await knex.schema.dropTableIfExists("jobDocuments");
  await knex.schema.dropTableIfExists("disputes");
  await knex.schema.dropTableIfExists("jobPhotos");
  await knex.schema.dropTableIfExists("reviews");
  await knex.schema.dropTableIfExists("messageStatus");
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversationParticipants");
  await knex.schema.dropTableIfExists("conversations");
  await knex.schema.dropTableIfExists("documents");
  await knex.schema.dropTableIfExists("documentTypeRoleRequirements");
  await knex.schema.dropTableIfExists("documentTypes");

  console.log("✅ Rollback complete.[20250620091637_create_document_and_chat_tables.ts]");
}

