// tests/queue.test.js
const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

jest.setTimeout(30000);

// Use REDIS_URL from env (you said you set it)
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
});

describe("Queue behaviour – BullMQ", () => {
  afterAll(async () => {
    await connection.quit();
  });

  test("worker returns result for a job", async () => {
    const queueName = `orders-test-${Date.now()}`;

    const queue = new Queue(queueName, { connection });

    const queueEvents = new QueueEvents(queueName, { connection });
    await queueEvents.waitUntilReady();

    const worker = new Worker(
      queueName,
      async (job) => {
        // fake processing logic
        return {
          status: "completed",
          tokenIn: job.data.tokenIn,
          tokenOut: job.data.tokenOut,
          amountIn: job.data.amountIn,
        };
      },
      { connection }
    );
    await worker.waitUntilReady();

    const job = await queue.add("test-order", {
      tokenIn: "SOL",
      tokenOut: "USDC",
      amountIn: 0.1,
    });

    // NOTE: use queueEvents instead of q.events
    const result = await job.waitUntilFinished(queueEvents, 15000);

    expect(result.status).toBe("completed");
    expect(result.tokenIn).toBe("SOL");
    expect(result.tokenOut).toBe("USDC");

    await worker.close();
    await queueEvents.close();
    await queue.close();
  });
});
