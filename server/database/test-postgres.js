require("dotenv").config();

const db = require("./postgres");

async function testConnection() {
  try {
    const result = await db.query("SELECT NOW() AS current_time");

    console.log("Connected to Supabase PostgreSQL.");
    console.log("Database time:", result.rows[0].current_time);
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

testConnection();