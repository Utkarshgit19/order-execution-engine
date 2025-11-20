// src/queue/orderQueue.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";
import "dotenv/config";


if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}
import { redisConnection } from "../redis";

export const orderQueue = new Queue("orders", {
  connection: redisConnection,
});


// export const redisConnection = new IORedis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false, // needed for Upstash-style hosted Redis
// });

// export const orderQueue = new Queue("orders", {
//   connection: redisConnection, // pass instance directly
// });
