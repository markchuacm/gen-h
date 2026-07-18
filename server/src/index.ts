import { buildApp } from "./app.js";
import { closeAuthDatabase } from "./auth/auth.js";
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
  await closeAuthDatabase();
  await closeDatabase();
};
process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

await app.listen({ host: env.HOST, port: env.PORT });
