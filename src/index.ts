import { buildServer } from "./server";
import { env } from "./config/env";
import { initDb } from "./db/db";

import { startOrderWorker } from "./queue/orderWorker";

async function main() {
  startOrderWorker();
  await initDb();
  const app = buildServer();

  app.listen({ port: env.port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log("Server listening at", address);
  });
}

main();
