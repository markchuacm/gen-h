import { buildApp } from "./app.js";
import { env } from "./config.js";
import { closeDatabase } from "./db/pools.js";
import { getBoss, stopBoss } from "./jobs/boss.js";
import { ensureDevelopmentBuckets } from "./services/storage.js";

const app = await buildApp();
await ensureDevelopmentBuckets();
await getBoss();

const shutdown = async () => {
  await app.close();
  await stopBoss();
  await closeDatabase();
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

await app.listen({ host: env.HOST, port: env.PORT });
