import knex, { Knex } from 'knex';
import { Model } from 'objection';
import config from './knexfile';

const env = process.env.NODE_ENV || 'development';
let db: Knex;

async function initializeDatabase(retries = 5): Promise<Knex> {
    for (let i = 0; i < retries; i++) {
        try {
            db = knex(config[env]);
            await db.raw('SELECT 1');
            Model.knex(db);
            console.log('✅ Database connected');
            return db;
        } catch (error: any) {
            console.error(`DB connection attempt ${i + 1}/${retries} failed`);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Failed to connect to database');
}

export const dbReady = initializeDatabase();
export default db!;
