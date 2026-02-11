const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    
    console.log("🔍 Testing database connection...");
    console.log("Connection string preview:", connectionString?.substring(0, 70) + "...");
    
    const client = new Client({
        connectionString,
        ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        console.log("⏳ Connecting...");
        await client.connect();
        console.log("✅ Connected!");
        
        const result = await client.query('SELECT NOW(), version()');
        console.log("✅ Query successful!");
        console.log("Time:", result.rows[0].now);
        console.log("PostgreSQL version:", result.rows[0].version.substring(0, 50));
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED!");
        console.error("Error:", error.message);
        console.error("Code:", error.code);
        console.error("Syscall:", error.syscall);
        process.exit(1);
    }
}

testConnection();
