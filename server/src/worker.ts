import { closeDatabase } from "./db/pools.js";
import { getBoss, stopBoss } from "./jobs/boss.js";
import type { ConsultEmailJob } from "./services/appointments.js";
import { sendBloodFormEmail } from "./workers/blood-form-email.js";
import { generateCarePlan } from "./workers/care-plan-generator.js";
import { sendConsultEmail } from "./workers/consult-email.js";
import { scanDocument } from "./workers/document-scanner.js";
import { processLabEvent } from "./workers/lab-processor.js";

const boss = await getBoss();
await boss.work<{ eventId: string }>("process-lab-event", { batchSize: 5, localConcurrency: 2 }, async (jobs) => {
  for (const job of jobs) await processLabEvent(job.data.eventId);
});
await boss.work<{ documentId: string }>("scan-document", { batchSize: 2, localConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) await scanDocument(job.data.documentId);
});
await boss.work<ConsultEmailJob>("send-consult-email", { batchSize: 5, localConcurrency: 2 }, async (jobs) => {
  for (const job of jobs) await sendConsultEmail(job.data);
});
await boss.work<{ memberId: string }>("send-blood-form-email", { batchSize: 5, localConcurrency: 2 }, async (jobs) => {
  for (const job of jobs) await sendBloodFormEmail(job.data.memberId);
});
await boss.work<{ memberId: string; reportId: string }>(
  "generate-care-plan",
  { batchSize: 3, localConcurrency: 1 },
  async (jobs) => {
    for (const job of jobs) await generateCarePlan(job.data.memberId, job.data.reportId);
  },
);

const shutdown = async () => {
  await stopBoss();
  await closeDatabase();
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
