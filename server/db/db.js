const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Serpapi',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5433,
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');
    
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};