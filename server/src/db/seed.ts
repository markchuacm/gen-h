import { auth } from "../auth/auth.js";
import { env } from "../config.js";
import { systemPool } from "./pools.js";
import { encryptPartnerSecret } from "../services/partner-secrets.js";

const PASSWORD = "Verae-local-2026!";

async function ensureUser(name: string, email: string, role: "member" | "doctor" | "admin") {
  const existing = await systemPool.query<{ id: string }>('select id from identity."user" where email=$1', [email]);
  let id = existing.rows[0]?.id;
  if (!id) {
    const result = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } });
    id = result.user.id;
  }
  await systemPool.query('update identity."user" set "emailVerified"=true where id=$1', [id]);
  await systemPool.query("update app.profiles set role=$2,account_status='active',full_name=$3 where id=$1", [id, role, name]);
  if (role === "member") {
    await systemPool.query(
      `insert into app.member_profiles (member_id,preferred_name,age,sex,height_cm,weight_kg,onboarding_status,current_stage,profile_confirmed_at)
       values ($1,$2,38,'female',165,62,'completed','results_ready',now()) on conflict (member_id) do nothing`,
      [id, name.split(" ")[0]],
    );
  }
  return id;
}

async function seed(): Promise<void> {
  if (env.NODE_ENV === "production") throw new Error("Synthetic seed is disabled in production");
  const adminId = await ensureUser("Verae Admin", "admin@example.test", "admin");
  const doctorId = await ensureUser("Dr Synthetic", "doctor@example.test", "doctor");
  const memberId = await ensureUser("Amina Synthetic", "member@example.test", "member");

  await systemPool.query(
    `insert into app.doctor_assignments (member_id,doctor_id,assigned_by)
     values ($1,$2,$3) on conflict (member_id) where status='active' do nothing`,
    [memberId, doctorId, adminId],
  );
  const partner = await systemPool.query<{ id: string }>("select id from integration.lab_partners where slug='innoquest'");
  const partnerId = partner.rows[0]!.id;
  await systemPool.query(
    `insert into integration.partner_credentials (partner_id,key_id,secret_ciphertext)
     values ($1,'local-uat',$2) on conflict (partner_id,key_id) do nothing`,
    [partnerId, encryptPartnerSecret("verae-innoquest-uat-secret")],
  );
  for (const mapping of [
    ["HBA1C", "%", "HBA1C", "%"],
    ["GLUCOSE", "mmol/L", "GLUCOSE", "mmol/L"],
    ["APOB", "g/L", "APOB", "g/L"],
  ]) {
    await systemPool.query(
      `insert into integration.code_mappings
        (partner_id,source_code,source_unit,biomarker_code,normalized_unit,version,status,approved_by,approved_at)
       values ($1,$2,$3,$4,$5,1,'approved',$6,now())
       on conflict (partner_id,source_code,source_unit,version) do nothing`,
      [partnerId, ...mapping, adminId],
    );
  }
  await systemPool.query(
    `insert into app.onboarding_responses (member_id,question_key,response)
     values ($1,'basics',$2::jsonb) on conflict (member_id,question_key) do update set response=excluded.response`,
    [memberId, JSON.stringify({ age: 38, sex: "female", goals: ["Improve metabolic health"] })],
  );
  const order = await systemPool.query<{ client_order_id: string }>(
    `insert into app.lab_orders (member_id,partner_id,biomarker_codes,status,ordered_at,created_by)
     values ($1,$2,array['HBA1C','GLUCOSE','APOB'],'ordered',now(),$3) returning client_order_id`,
    [memberId, partnerId, doctorId],
  );
  console.info(JSON.stringify({
    message: "Synthetic data created",
    password: PASSWORD,
    users: ["admin@example.test", "doctor@example.test", "member@example.test"],
    innoquestUatSecret: "verae-innoquest-uat-secret",
    clientOrderId: order.rows[0]!.client_order_id,
  }, null, 2));
  await systemPool.end();
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
