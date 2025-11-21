// src/routes/orders.ts
import { FastifyInstance } from "fastify";
import { createOrder } from "../services/orderService";
import { registerOrderSocket } from "../ws/orderWs";
import { pool } from "../db/db";

export async function ordersRoutes(app: FastifyInstance) {
  // HTTP: create order
  app.post("/orders/execute", async (req, reply) => {
    const body = req.body as {
      tokenIn?: string;
      tokenOut?: string;
      amountIn?: number;
      type?: string;
    };

    if (!body?.tokenIn || !body?.tokenOut || body.amountIn == null) {
      return reply
        .status(400)
        .send({ error: "tokenIn, tokenOut, amountIn are required" });
    }

    if (body.amountIn <= 0) {
      return reply.status(400).send({ error: "amountIn must be > 0" });
    }

    if (body.type && body.type !== "market") {
      return reply
        .status(400)
        .send({ error: "Only 'market' order type is supported" });
    }

    const order = await createOrder({
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      type: "market",
    });

    return reply.send({ orderId: order.id });
  });

  // WebSocket: status stream
  app.get(
    "/orders/ws",
    { websocket: true },
    (connection, req) => {
      try {
        const rawUrl =
          (req as any).raw?.url ??
          (req as any).url ??
          "";

        const url = new URL(rawUrl, "http://localhost");
        const orderId = url.searchParams.get("orderId");

        console.log("WS connected, rawUrl =", rawUrl, "orderId =", orderId);

        if (!orderId) {
          connection.socket?.send?.(
            JSON.stringify({ error: "Missing orderId query param" })
          );
          return;
        }

        const socket: any = (connection as any).socket ?? connection;

        // Register socket for live updates from worker
        registerOrderSocket(orderId, socket);

        // Send DB snapshot + history (in case worker already finished)
        (async () => {
          try {
            const res = await pool.query(
              `
              SELECT status, status_history, dex_chosen, tx_hash, executed_price
              FROM orders
              WHERE id = $1
              `,
              [orderId]
            );

            if (res.rows.length === 0) {
              socket.send(
                JSON.stringify({
                  status: "unknown_order",
                  message: "No order found with this id",
                })
              );
              return;
            }

            const row = res.rows[0];

            // Immediate connection acknowledgment
            socket.send(
              JSON.stringify({
                status: "ws_connected",
                orderId,
              })
            );

            // Replay history events
            if (Array.isArray(row.status_history)) {
              for (const event of row.status_history) {
                socket.send(JSON.stringify(event));
              }
            }

            // Final snapshot
            socket.send(
              JSON.stringify({
                latestStatus: row.status,
                dexChosen: row.dex_chosen,
                txHash: row.tx_hash,
                executedPrice: row.executed_price,
              })
            );
          } catch (err) {
            console.error("WS: failed to load order from DB", err);
            socket.send(
              JSON.stringify({
                status: "error",
                message: "Failed to load order from DB",
              })
            );
          }
        })();
      } catch (err) {
        console.error("WS handler error:", err);
      }
    }
  );
}
