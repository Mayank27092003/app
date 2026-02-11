import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("stripeAccounts", (table) => {
    table.increments("id").primary();
    table.integer("userId").unsigned().references("id").inTable("users").onDelete("SET NULL").nullable();
    table.integer("companyId").unsigned().references("id").inTable("companies").onDelete("SET NULL").nullable();
    table.integer("driverId").unsigned().references("id").inTable("drivers").onDelete("SET NULL").nullable();
    table.string("stripeAccountId").notNullable();
    table.enu("accountType", ["individual", "company"]).notNullable();
    table.boolean("isVerified").notNullable().defaultTo(false);
    table.boolean("isActive").notNullable().defaultTo(true);
    table.json("capabilities").nullable();
    table.boolean("chargesEnabled").notNullable().defaultTo(false);
    table.boolean("payoutsEnabled").notNullable().defaultTo(false);
    table.json("requirements").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.index(["userId", "stripeAccountId"], "idx_stripeAccounts_userId_accountId");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("stripeAccounts");
}
