// src/queue/orderWorker.ts
import { Worker, Job } from "bullmq";
// import { redisConnection } from "./orderQueue";
import { pool } from "../db/db";
import { DexRouter } from "../services/dexRouter";
import { createConnection, loadWallet } from "../services/solanaClient";
import { updateOrderStatus } from "../services/orderService";
import { sendOrderStatus } from "../ws/orderWs";
import { Order, OrderStatus } from "../types/order";

import { redisConnection } from "../redis";

interface OrderJobData {
  orderId: string;
}



async function fetchOrder(orderId: string): Promise<Order | null> {
  const res = await pool.query(
    "SELECT id, type, token_in, token_out, amount_in, status FROM orders WHERE id = $1",
    [orderId]
  );
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    type: row.type,
    tokenIn: row.token_in,
    tokenOut: row.token_out,
    amountIn: Number(row.amount_in),
    status: row.status as OrderStatus,
  };
}

export function startOrderWorker() {
  const connection = createConnection();
  const wallet = loadWallet();

  const dexRouter = new DexRouter(connection, wallet, {
    raydiumPoolId: process.env.RAYDIUM_POOL_ID || "",
    meteoraPool: process.env.METEORA_POOL_PUBKEY || "",
    tokenInMint: process.env.TOKEN_IN_MINT || "",
    tokenOutMint: process.env.TOKEN_OUT_MINT || "",
    slippageTolerance: Number(process.env.SLIPPAGE_TOLERANCE || "0.01"),
  });

  const worker = new Worker<OrderJobData>(
    "orders",
    async (job: Job<OrderJobData>) => {
      const { orderId } = job.data;
      console.log("Worker: processing order", orderId);

      await new Promise((res) => setTimeout(res, 1000));

      const order = await fetchOrder(orderId);
      if (!order) {
        console.warn("Worker: order not found", orderId);
        return;
      }

     // --- 1) Status: routing ---
sendOrderStatus(order.id, { status: "routing" });
await updateOrderStatus(order.id, "routing");

// --- 2) Route quote selection ---
const bestQuote = await dexRouter.getBestQuote(order);

// --- 3) Status: building ---
sendOrderStatus(order.id, {
  status: "building",
  dexChosen: bestQuote.dex,
});
await updateOrderStatus(order.id, "building", {
  dexChosen: bestQuote.dex,
});

// --- Artificial delay to visualize steps nicely ---
await new Promise((res) => setTimeout(res, 800));

const { txHash, executedPrice } = await dexRouter.executeSwap(
  bestQuote,
  order
);

// 5) Status: submitted
sendOrderStatus(order.id, {
  status: "submitted",
  txHash,
});
await updateOrderStatus(order.id, "submitted", { txHash });

// 6) Status: confirmed
sendOrderStatus(order.id, {
  status: "confirmed",
  txHash,
  executedPrice,
});
await updateOrderStatus(order.id, "confirmed", {
  txHash,
  executedPrice,
});

      console.log("Worker: finished order", orderId);
    },
    {
      connection: redisConnection,
    }
  );

  worker.on("completed", (job) => {
    console.log("Worker: job completed", job.id);
  });

  worker.on("failed", (job, err) => {
    console.error("Worker: job failed", job?.id, err);
  });

  console.log("Order worker started");
}
