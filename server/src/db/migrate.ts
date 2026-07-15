import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { adminDatabaseUrl } from "../config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../migrations");

async function migrate(): Promise<void> {
  const migrationPool = new Pool({ connectionString: adminDatabaseUrl(), application_name: "verae-migrations" });
  const client = await migrationPool.connect();
  try {
    await client.query(`
      create table if not exists public.verae_schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const applied = new Set<string>(
      (await client.query<{ name: string }>("select name from public.verae_schema_migrations")).rows.map((row) => row.name),
    );
    const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public.verae_schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.info(`Applied ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    client.release();
    await migrationPool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
