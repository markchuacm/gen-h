import { auth } from "../auth/auth.js";
import { adminDatabaseUrl, env } from "../config.js";
import { Pool } from "pg";

async function bootstrap(): Promise<void> {
  const adminPool = new Pool({ connectionString: adminDatabaseUrl(), application_name: "verae-bootstrap" });
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Verae Administrator";
  const confirmation = process.env.BOOTSTRAP_ADMIN_CONFIRM;
  if (!env.BOOTSTRAP_ADMIN_TOKEN || confirmation !== env.BOOTSTRAP_ADMIN_TOKEN) {
    throw new Error("BOOTSTRAP_ADMIN_CONFIRM must match BOOTSTRAP_ADMIN_TOKEN");
  }
  if (!email || !password) throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
  const existing = await adminPool.query("select 1 from app.profiles where role='admin' limit 1");
  if (existing.rowCount) throw new Error("An administrator already exists; bootstrap is permanently disabled");
  const created = await auth.api.signUpEmail({ body: { name, email, password } });
  await adminPool.query('update identity."user" set "emailVerified"=true where id=$1', [created.user.id]);
  await adminPool.query("update app.profiles set role='admin',account_status='active' where id=$1", [created.user.id]);
  console.info(`Administrator created for ${email}. Enable TOTP before setting REQUIRE_STAFF_MFA=true.`);
  await adminPool.end();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
