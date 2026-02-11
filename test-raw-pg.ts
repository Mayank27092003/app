import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testRawConnection() {
    const connectionString = process.env.DATABASE_URL;
    
    console.log("🔍 Testing raw pg connection...");
    console.log("Connection string (first 60 chars):", connectionString?.substring(0, 60) + "...");
    
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log("Attempting to connect...");
        await client.connect();
        console.log("✅ Connected successfully!");
        
        const result = await client.query('SELECT NOW()');
        console.log("✅ Query successful! Time:", result.rows[0].now);
        
        await client.end();
        console.log("✅ Connection closed");
        process.exit(0);
    } catch (error: any) {
        console.error("❌ Connection failed!");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error syscall:", error.syscall);
        console.error("Error errno:", error.errno);
        process.exit(1);
    }
}

testRawConnection();
