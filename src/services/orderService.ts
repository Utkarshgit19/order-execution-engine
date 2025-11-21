// src/services/orderService.ts
import { pool } from "../db/db";
import { Order, OrderType, OrderStatus } from "../types/order";
import { randomUUID } from "crypto";
import { orderQueue } from "../queue/orderQueue";


export async function createOrder(input: {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  type?: OrderType;
}): Promise<Order> {
  const id = randomUUID();
  const type: OrderType = input.type ?? "market";

  const insertResult = await pool.query(
    `
    INSERT INTO orders (id, type, token_in, token_out, amount_in, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, type, token_in, token_out, amount_in, status, created_at, updated_at
  `,
    [id, type, input.tokenIn, input.tokenOut, input.amountIn, "pending"]
  );

  const row = insertResult.rows[0];

  const order: Order = {
    id: row.id,
    type: row.type as OrderType,
    tokenIn: row.token_in,
    tokenOut: row.token_out,
    amountIn: Number(row.amount_in),
    status: row.status as OrderStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  await orderQueue.add("execute", { orderId: order.id });
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: {
    dexChosen?: "raydium" | "meteora";
    txHash?: string;
    executedPrice?: number;
    error?: string;
  } = {}
): Promise<void> {
  await pool.query(
    `
    UPDATE orders
    SET
      status = $2::text,
      dex_chosen = COALESCE($3::text, dex_chosen),
      tx_hash = COALESCE($4::text, tx_hash),
      executed_price = COALESCE($5::numeric, executed_price),
      updated_at = NOW()
    WHERE id = $1::uuid
    `,
    [
      orderId,
      status,
      extra.dexChosen ?? null,
      extra.txHash ?? null,
      extra.executedPrice ?? null,
    ]
  );
}