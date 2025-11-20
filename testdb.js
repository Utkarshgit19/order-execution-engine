// testDb.js
require("dotenv").config();
const { Client } = require("pg");

async function main() {
  console.log("🔹 Starting DB test script...");

  console.log("🔹 DATABASE_URL =", process.env.DATABASE_URL || "(not set)");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // needed for Neon
  });

  try {
    console.log("🔹 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to Neon!");

    const res = await client.query("SELECT NOW()");
    console.log("🕒 DB time:", res.rows[0]);
  } catch (err) {
    console.error("❌ Error while talking to DB:");
    console.error(err);
  } finally {
    await client.end();
    console.log("🔹 Connection closed.");
  }
}

main();
