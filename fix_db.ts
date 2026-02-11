
import knex from 'knex';
import config from './src/database/knexfile';
import { seed } from './src/database/seeds/01_seed_roles_company_types_users';

const db = knex(config.development);

async function fixDatabase() {
    try {
        console.log("🔧 Starting manual database fix...");

        // 1. Create roleCategories table
        const hasRoleCategories = await db.schema.hasTable('roleCategories');
        if (!hasRoleCategories) {
            console.log("Creating 'roleCategories' table...");
            await db.schema.createTable("roleCategories", (table) => {
                table.increments("id").primary();
                table.string("name").unique().notNullable();
                table.string("description").nullable();
                table.timestamp("createdAt").defaultTo(db.fn.now());
                table.timestamp("updatedAt").defaultTo(db.fn.now());
            });
        } else {
            console.log("'roleCategories' table already exists.");
        }

        // 2. Add categoryId to roles
        const hasCategoryId = await db.schema.hasColumn('roles', 'categoryId');
        if (!hasCategoryId) {
            console.log("Adding 'categoryId' to 'roles' table...");
            await db.schema.alterTable("roles", (table) => {
                table
                    .integer("categoryId")
                    .unsigned()
                    .references("id")
                    .inTable("roleCategories")
                    .onDelete("SET NULL");
            });
        } else {
            console.log("'categoryId' column already exists in 'roles'.");
        }

        // 3. Add roleCategoryId to companyTypes
        const hasRoleCategoryId = await db.schema.hasColumn('companyTypes', 'roleCategoryId');
        if (!hasRoleCategoryId) {
            console.log("Adding 'roleCategoryId' to 'companyTypes' table...");
            await db.schema.alterTable("companyTypes", (table) => {
                table
                    .integer("roleCategoryId")
                    .unsigned()
                    .references("id")
                    .inTable("roleCategories")
                    .onDelete("SET NULL");
            });
        } else {
            console.log("'roleCategoryId' column already exists in 'companyTypes'.");
        }

        // 4. Run Seeds
        console.log("🌱 Running seeds...");
        await seed(db);

        console.log("✅ Database fix completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database fix failed:", error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

fixDatabase();
