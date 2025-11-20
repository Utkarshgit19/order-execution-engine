import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  redisUrl: process.env.REDIS_URL!,
  pg: {
    host: process.env.PG_HOST!,
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER!,
    password: process.env.PG_PASSWORD!,
    database: process.env.PG_DATABASE!
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL!,
    cluster: process.env.SOLANA_CLUSTER || "devnet",
    walletPrivateKeyBase58: process.env.WALLET_PRIVATE_KEY_BASE58!
  }
};
