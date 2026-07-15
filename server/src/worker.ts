import { closeDatabase } from "./db/pools.js";
import { getBoss, stopBoss } from "./jobs/boss.js";
import { scanDocument } from "./workers/document-scanner.js";
import { processLabEvent } from "./workers/lab-processor.js";

const boss = await getBoss();
await boss.work<{ eventId: string }>("process-lab-event", { batchSize: 5, localConcurrency: 2 }, async (jobs) => {
  for (const job of jobs) await processLabEvent(job.data.eventId);
});
await boss.work<{ documentId: string }>("scan-document", { batchSize: 2, localConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) await scanDocument(job.data.documentId);
});

const shutdown = async () => {
  await stopBoss();
  await closeDatabase();
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
