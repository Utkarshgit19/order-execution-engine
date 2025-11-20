import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // needed for Neon/Render; safe for demo
  },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      type TEXT NOT NULL,
      token_in TEXT NOT NULL,
      token_out TEXT NOT NULL,
      amount_in NUMERIC NOT NULL,
      status TEXT NOT NULL,
      dex_chosen TEXT,
      tx_hash TEXT,
      executed_price NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("DB initialized (orders table ready)");
}