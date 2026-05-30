require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
console.log(process.env.DATABASE_URL);
// Test database connection
async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0].now);
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

testConnection();

module.exports = pool;
