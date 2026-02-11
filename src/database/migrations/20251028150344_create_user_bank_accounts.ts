import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Creating 'userBankAccounts' table...");
  
  await knex.schema.createTable("userBankAccounts", (table) => {
    table.increments("id").primary();
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("providerId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("paymentProviders")
      .onDelete("CASCADE");
    table.string("externalBankId").notNullable(); // e.g., Stripe bank account ID
    table.string("bankName").nullable();
    table.string("last4", 4).nullable();
    table.string("country", 2).nullable();
    table.string("currency", 3).nullable();
    table.boolean("isDefault").defaultTo(false);
    table.boolean("isVerified").defaultTo(false);
    table.boolean("isActive").defaultTo(true);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index("userId");
    table.index("providerId");
    table.index("externalBankId");
    table.index(["userId", "isActive"]);
  });

  console.log("✅ 'userBankAccounts' table created successfully");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Dropping 'userBankAccounts' table...");
  
  await knex.schema.dropTableIfExists("userBankAccounts");
  
  console.log("✅ 'userBankAccounts' table dropped successfully");
}
