// src/testRedisQueue.ts
import { orderQueue } from "./queue/orderQueue";
import "./queue/orderWorker"; // just importing starts the worker

(async () => {
  await orderQueue.add("demo-job", { hello: "world" });
  console.log("Job added!");
})();
