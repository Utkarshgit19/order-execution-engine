import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

export const redisConnection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

export const orderQueue = new Queue("orders", {
  connection: redisConnection,
});
