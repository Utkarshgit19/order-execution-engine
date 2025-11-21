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