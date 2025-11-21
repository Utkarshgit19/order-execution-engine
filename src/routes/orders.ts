import { FastifyInstance } from "fastify";
import { createOrder } from "../services/orderService";
import { registerOrderSocket } from "../ws/orderWs";

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

  // WebSocket: live stream only
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

        // register this socket so sendOrderStatus can push updates
        registerOrderSocket(orderId, socket);

        // optional handshake
        socket.send(
          JSON.stringify({
            status: "ws_connected",
            orderId,
          })
        );
      } catch (err) {
        console.error("WS handler error:", err);
      }
    }
  );
}
