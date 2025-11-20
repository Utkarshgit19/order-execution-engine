// src/redis.ts
import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,   // required for BullMQ
  enableReadyCheck: false,      // important for Upstash / managed Redis
  reconnectOnError: (err) => {
    console.error("Redis reconnectOnError:", err.message);
    return true; // always try to reconnect
  },
});
