import dotenv from 'dotenv';
dotenv.config();
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL || '',
        ssl: { rejectUnauthorized: false }
    }
});

async function cleanupCalls() {
    try {
        console.log('Cleaning up active calls...');
        
        // End all active calls
        const result = await db('call_sessions')
            .where('status', 'ringing')
            .orWhere('status', 'connected')
            .orWhere('status', 'initiating')
            .update({
                status: 'ended',
                endTime: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        
        console.log(`✅ Cleaned up ${result} call(s)`);
        
        // Show remaining calls
        const remainingCalls = await db('call_sessions')
            .select('id', 'status', 'createdAt')
            .orderBy('createdAt', 'desc')
            .limit(5);
        
        console.log('\nRecent calls:');
        console.table(remainingCalls);
        
        await db.destroy();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        await db.destroy();
        process.exit(1);
    }
}

cleanupCalls();
