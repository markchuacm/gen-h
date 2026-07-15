import { Pool } from "pg";
import { adminDatabaseUrl } from "../config.js";
import { encryptPartnerSecret } from "../services/partner-secrets.js";

async function createCredential(): Promise<void> {
  const slug = process.env.PARTNER_SLUG;
  const keyId = process.env.PARTNER_KEY_ID;
  const secret = process.env.PARTNER_SHARED_SECRET;
  if (!slug || !keyId || !secret || secret.length < 32) {
    throw new Error("PARTNER_SLUG, PARTNER_KEY_ID, and a 32+ character PARTNER_SHARED_SECRET are required");
  }
  const pool = new Pool({ connectionString: adminDatabaseUrl(), application_name: "verae-partner-credential" });
  try {
    const partner = await pool.query<{ id: string }>("select id from integration.lab_partners where slug=$1", [slug]);
    if (!partner.rows[0]) throw new Error(`Unknown partner: ${slug}`);
    await pool.query("update integration.partner_credentials set revoked_at=now() where partner_id=$1 and key_id=$2 and revoked_at is null", [partner.rows[0].id, keyId]);
    await pool.query(
      "insert into integration.partner_credentials (partner_id,key_id,secret_ciphertext) values ($1,$2,$3)",
      [partner.rows[0].id, keyId, encryptPartnerSecret(secret)],
    );
    console.info(`Credential ${keyId} created for ${slug}; deliver the shared secret through the approved secure channel`);
  } finally {
    await pool.end();
  }
}

createCredential().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
