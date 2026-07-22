import { PgBoss } from "pg-boss";
import { jobsDatabaseUrl } from "../config.js";

let instance: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (instance) return instance;
  instance = new PgBoss({
    connectionString: jobsDatabaseUrl(),
    schema: "pgboss",
    // The schema is created and owned by the dedicated jobs login in the
    // platform migration. Avoid requiring CREATE on the whole database.
    createSchema: false,
    application_name: "verae-jobs",
  });
  instance.on("error", (error) => console.error(JSON.stringify({ event: "job_queue_error", message: String(error) })));
  await instance.start();
  await instance.createQueue("process-lab-event", { retryLimit: 8, retryDelay: 30, retryBackoff: true });
  await instance.createQueue("scan-document", { retryLimit: 5, retryDelay: 60, retryBackoff: true });
  await instance.createQueue("send-consult-email", { retryLimit: 5, retryDelay: 60, retryBackoff: true });
  await instance.createQueue("send-blood-form-email", { retryLimit: 5, retryDelay: 60, retryBackoff: true });
  return instance;
}

export async function stopBoss(): Promise<void> {
  if (!instance) return;
  await instance.stop({ graceful: true, timeout: 10_000 });
  instance = null;
}
