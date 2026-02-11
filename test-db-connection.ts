import "dotenv/config";
import db from "./src/database/db";

async function testConnection() {
    try {
        console.log("🔍 Testing database connection...");
        console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");
        
        const result = await db.raw("SELECT NOW() as current_time");
        console.log("✅ Database connection successful!");
        console.log("Current time from DB:", result.rows[0].current_time);
        
        await db.destroy();
        process.exit(0);
    } catch (error: any) {
        console.error("❌ Database connection failed:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Full error:", error);
        process.exit(1);
    }
}

testConnection();
