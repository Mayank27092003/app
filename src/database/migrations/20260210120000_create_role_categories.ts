import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    console.log("🔄 Creating 'roleCategories' table...");
    await knex.schema.createTable("roleCategories", (table) => {
        table.increments("id").primary();
        table.string("name").unique().notNullable();
        table.string("description").nullable();
        table.timestamp("createdAt").defaultTo(knex.fn.now());
        table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });

    console.log("🔄 Adding 'categoryId' to 'roles' table...");
    await knex.schema.alterTable("roles", (table) => {
        table
            .integer("categoryId")
            .unsigned()
            .references("id")
            .inTable("roleCategories")
            .onDelete("SET NULL");
    });

    console.log("🔄 Adding 'roleCategoryId' to 'companyTypes' table...");
    await knex.schema.alterTable("companyTypes", (table) => {
        table
            .integer("roleCategoryId")
            .unsigned()
            .references("id")
            .inTable("roleCategories")
            .onDelete("SET NULL");
    });
}

export async function down(knex: Knex): Promise<void> {
    console.log("⏬ Dropping 'roleCategoryId' from 'companyTypes'...");
    await knex.schema.alterTable("companyTypes", (table) => {
        table.dropColumn("roleCategoryId");
    });

    console.log("⏬ Dropping 'categoryId' from 'roles'...");
    await knex.schema.alterTable("roles", (table) => {
        table.dropColumn("categoryId");
    });

    console.log("⏬ Dropping 'roleCategories' table...");
    await knex.schema.dropTableIfExists("roleCategories");
}
