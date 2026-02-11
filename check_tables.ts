
import knex from 'knex';
import config from './src/database/knexfile';

const db = knex(config.development);

async function listTables() {
    try {
        const result = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables in database:", result.rows.map((r: any) => r.table_name));

        const tables = result.rows.map((r: any) => r.table_name);
        console.log("Tables in database:", tables);

        const tablesToCheck = ["userFcmTokens", "user_sessions", "companyTypes", "jobVisibilityRoles"];
        for (const table of tablesToCheck) {
            try {
                console.log(`Querying '${table}'...`);
                await db(table).select("*").limit(1);
                console.log(`Success '${table}'`);
            } catch (e: any) {
                console.log(`Failed '${table}':`, e.message);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

listTables();
