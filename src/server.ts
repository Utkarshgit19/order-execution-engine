import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { ordersRoutes } from "./routes/orders";

export function buildServer() {
  const app = Fastify();
  app.register(websocket);
  app.register(ordersRoutes, { prefix: "/api" });
  return app;
}
