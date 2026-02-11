
import knex from 'knex';
import config from './src/database/knexfile';

const db = knex(config.development);

async function listTables() {
    try {
        const result = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
        console.log("Found " + result.rows.length + " tables:");
        for (const row of result.rows) {
            console.log(" - " + row.table_name);
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
