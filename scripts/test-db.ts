import { Client } from 'pg';

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'loadrider',
  password: 'postgres',
  port: 5432,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to Postgres successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
