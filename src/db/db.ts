import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool(env.pg);

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
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
