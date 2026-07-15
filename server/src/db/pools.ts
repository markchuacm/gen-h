import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool, type PoolClient } from "pg";
import { env } from "../config.js";

export const systemPool = new Pool({
  connectionString: env.PROCESS_ROLE === "worker" ? (env.WORKER_DATABASE_URL ?? env.DATABASE_URL) : env.DATABASE_URL,
  max: env.NODE_ENV === "production" ? 10 : 5,
  idleTimeoutMillis: 30_000,
  application_name: "verae-api",
});

export const db = new Kysely<Record<string, never>>({
  dialect: new PostgresDialect({ pool: systemPool }),
});

export type Actor = {
  userId: string;
  role: "member" | "doctor" | "admin";
  requestId: string;
};

export async function withActor<T>(actor: Actor, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await systemPool.connect();
  try {
    await client.query("begin");
    await client.query("set local role verae_app");
    await client.query("select set_config('app.user_id', $1, true)", [actor.userId]);
    await client.query("select set_config('app.user_role', $1, true)", [actor.role]);
    await client.query("select set_config('app.request_id', $1, true)", [actor.requestId]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function withWorker<T>(requestId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await systemPool.connect();
  try {
    await client.query("begin");
    await client.query("set local role verae_worker");
    await client.query("select set_config('app.user_role', 'worker', true)");
    await client.query("select set_config('app.request_id', $1, true)", [requestId]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function databaseReady(): Promise<boolean> {
  try {
    await sql`select 1`.execute(db);
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}
