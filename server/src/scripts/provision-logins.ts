import { Pool } from "pg";
import { adminDatabaseUrl, env, jobsDatabaseUrl } from "../config.js";

function credential(urlValue: string, expectedUser: string): string {
  const url = new URL(urlValue);
  if (decodeURIComponent(url.username) !== expectedUser || !url.password) {
    throw new Error(`Expected ${expectedUser} with a password in its dedicated database URL`);
  }
  return decodeURIComponent(url.password);
}

async function provision(): Promise<void> {
  const roles = [
    ["verae_api_login", credential(env.DATABASE_URL, "verae_api_login")],
    ["verae_auth_login", credential(env.AUTH_DATABASE_URL!, "verae_auth_login")],
    ["verae_worker_login", credential(env.WORKER_DATABASE_URL!, "verae_worker_login")],
    ["verae_jobs_login", credential(jobsDatabaseUrl(), "verae_jobs_login")],
  ] as const;
  const pool = new Pool({ connectionString: adminDatabaseUrl(), application_name: "verae-role-provisioner" });
  try {
    for (const [role, password] of roles) {
      const formatted = await pool.query<{ statement: string }>(
        "select format('alter role %I login password %L', $1::text, $2::text) as statement",
        [role, password],
      );
      await pool.query(formatted.rows[0]!.statement);
    }
    await pool.query("alter role verae_api_login set statement_timeout = '15s'");
    await pool.query("alter role verae_auth_login set statement_timeout = '15s'");
    await pool.query("alter role verae_worker_login set statement_timeout = '5min'");
    await pool.query("alter role verae_jobs_login set statement_timeout = '5min'");
    console.info("Dedicated database logins enabled");
  } finally {
    await pool.end();
  }
}

provision().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
