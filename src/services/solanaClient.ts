import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { env } from "../config/env";

export function createConnection() {
  const rpcUrl =
  env.solana?.rpcUrl ||
  clusterApiUrl((env.solana?.cluster as "devnet" | "testnet" | "mainnet-beta") || "devnet");
  return new Connection(rpcUrl, "confirmed");
}

export function loadWallet(): Keypair {
  // For mock devnet, we don't actually need a real wallet.
  // Just return a random keypair to satisfy types.
  return Keypair.generate();
}
