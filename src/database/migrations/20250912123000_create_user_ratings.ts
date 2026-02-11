import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const has = await knex.schema.hasTable("userRatings");
  if (has) return;
  await knex.schema.createTable("userRatings", (table) => {
    table.increments("id").primary();
    table.integer("contractId").notNullable().references("id").inTable("contracts").onDelete("CASCADE");
    table.integer("raterUserId").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("rateeUserId").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("stars").notNullable();
    table.text("comment");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.unique(["contractId", "raterUserId", "rateeUserId"], { indexName: "uniq_contract_rater_ratee" });
    table.index(["rateeUserId"], "user_ratings_ratee_idx");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("userRatings");
}


