import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("StripePayments");
  
  if (hasTable) {
    // Add stripeCheckoutSessionId column if it doesn't exist
    const hasSessionIdColumn = await knex.schema.hasColumn("StripePayments", "stripeCheckoutSessionId");
    if (!hasSessionIdColumn) {
      await knex.schema.alterTable("StripePayments", (table) => {
        table.string("stripeCheckoutSessionId").nullable();
        table.index("stripeCheckoutSessionId");
      });
    }

    // Make stripePaymentIntentId nullable
    // Using raw SQL because Knex's alter() method has limitations with altering existing columns
    try {
      await knex.raw(`
        ALTER TABLE "StripePayments" 
        ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL
      `);
    } catch (error: any) {
      // Column might already be nullable or error might occur - log and continue
      console.warn("Warning: Could not alter stripePaymentIntentId column:", error.message);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("StripePayments");
  
  if (hasTable) {
    // Remove stripeCheckoutSessionId column
    const hasSessionIdColumn = await knex.schema.hasColumn("StripePayments", "stripeCheckoutSessionId");
    if (hasSessionIdColumn) {
      await knex.schema.alterTable("StripePayments", (table) => {
        table.dropIndex("stripeCheckoutSessionId");
        table.dropColumn("stripeCheckoutSessionId");
      });
    }

    // Make stripePaymentIntentId not nullable again (if no null values exist)
    await knex.schema.alterTable("StripePayments", (table) => {
      table.string("stripePaymentIntentId").notNullable().alter();
    });
  }
}

