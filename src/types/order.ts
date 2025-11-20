// src/types/order.ts

// Only one order type for now
export type OrderType = "market";

export type OrderStatus =
  | "pending"
  | "routing"
  | "building"
  | "submitted"
  | "confirmed"
  | "failed";

export interface Order {
  id: string;
  type: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  status: OrderStatus;
  dexChosen?: "raydium" | "meteora";
  txHash?: string;
  executedPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
