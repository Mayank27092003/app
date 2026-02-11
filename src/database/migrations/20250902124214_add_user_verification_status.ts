import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log("🔄 Adding verification status to users table...");
  
  await knex.schema.alterTable("users", (table) => {
    // Add verification status enum column
    table.enu("verificationStatus", [
      "pending",           // Initial state when user signs up
      "profile_complete",   // User has completed their profile
      "documents_verified", // User has uploaded and verified documents
      "admin_verified",    // Admin has manually verified the user
      "fully_verified",    // All verification steps completed
      "suspended",         // Account suspended by admin
      "rejected"           // Verification rejected by admin
    ]).defaultTo("pending").notNullable();
    
    // Add verification metadata columns
    table.timestamp("verificationStatusUpdatedAt").nullable();
    table.integer("verifiedByUserId").unsigned().nullable().references("id").inTable("users");
    table.text("verificationNotes").nullable(); // Admin notes for verification decisions
    table.timestamp("lastVerificationAttemptAt").nullable();
  });
  
  console.log("✅ Added verification status columns to users table");
}

export async function down(knex: Knex): Promise<void> {
  console.log("🔄 Rolling back verification status from users table...");
  
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("verificationStatus");
    table.dropColumn("verificationStatusUpdatedAt");
    table.dropColumn("verifiedByUserId");
    table.dropColumn("verificationNotes");
    table.dropColumn("lastVerificationAttemptAt");
  });
  
  console.log("✅ Rolled back verification status columns from users table");
}
