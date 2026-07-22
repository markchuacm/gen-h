import type { PoolClient } from "pg";

// The data the Innoquest request form is filled from. Assembled server-side so
// the admin preview and the member download render from an identical payload;
// the PDF itself is generated client-side (see src/lib/bloodForm).
export type BloodFormPayload = {
  patient: {
    fullName: string | null;
    icPassportNo: string | null;
    dateOfBirth: string | null; // yyyy-mm-dd
    age: number | null;
    sex: string | null;
    address: string | null;
    phone: string | null;
  };
  order: {
    clientOrderId: string;
    orderedAt: string | null;
    formReleasedAt: string | null;
    selectedCodes: string[];
    omittedCodes: string[];
  };
  // Human-readable labels for mandatory fields still missing. When non-empty the
  // member is prompted to complete them before the form can be downloaded.
  missingFields: string[];
};

type MemberRow = {
  full_name: string | null;
  sex: string | null;
  age: number | null;
  date_of_birth: string | null;
  ic_passport_no: string | null;
  address: string | null;
  phone: string | null;
};

type OrderRow = {
  client_order_id: string;
  biomarker_codes: string[];
  ordered_at: string | null;
  form_released_at: string | null;
};

/** Whole years between a yyyy-mm-dd date of birth and now, or null. */
export function ageFromDob(dob: string | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

/**
 * Load the request-form payload for a member's active blood order. Returns null
 * when the member has no active order yet (nothing to fill). Runs under the
 * caller's RLS context, so it must be invoked inside withActor.
 */
export async function loadBloodFormPayload(
  client: PoolClient,
  memberId: string,
): Promise<BloodFormPayload | null> {
  const order = await client.query<OrderRow>(
    `select client_order_id, biomarker_codes, ordered_at, form_released_at
     from app.lab_orders where member_id = $1
       and status in ('draft','ordered','collected')
     order by created_at desc limit 1`,
    [memberId],
  );
  if (!order.rows[0]) return null;

  const [member, catalog] = await Promise.all([
    client.query<MemberRow>(
      // Cast date_of_birth to text so it is always a "yyyy-mm-dd" string; node-pg
      // would otherwise hand back a Date whose String() form the form can't parse.
      `select p.full_name, m.sex, m.age,
              to_char(m.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
              m.ic_passport_no, m.address, m.phone
       from app.member_profiles m
       join app.profiles p on p.id = m.member_id
       where m.member_id = $1`,
      [memberId],
    ),
    client.query<{ id: string }>("select id from app.biomarkers where is_active order by id"),
  ]);
  if (!member.rows[0]) return null;

  const row = member.rows[0];
  const orderRow = order.rows[0];
  const selected = new Set(orderRow.biomarker_codes);
  const omittedCodes = catalog.rows.map((c) => c.id).filter((id) => !selected.has(id));
  const dob = row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : null;

  const missingFields: string[] = [];
  if (!row.full_name?.trim()) missingFields.push("Full name");
  if (!row.ic_passport_no?.trim()) missingFields.push("IC / passport number");
  if (!dob) missingFields.push("Date of birth");
  if (!row.address?.trim()) missingFields.push("Address");

  return {
    patient: {
      fullName: row.full_name,
      icPassportNo: row.ic_passport_no,
      dateOfBirth: dob,
      age: ageFromDob(dob) ?? row.age,
      sex: row.sex,
      address: row.address,
      phone: row.phone,
    },
    order: {
      clientOrderId: orderRow.client_order_id,
      orderedAt: orderRow.ordered_at,
      formReleasedAt: orderRow.form_released_at,
      selectedCodes: orderRow.biomarker_codes,
      omittedCodes,
    },
    missingFields,
  };
}
