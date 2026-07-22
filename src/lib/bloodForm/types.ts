// Payload returned by GET /v1/member/blood-form. Mirrors the server's
// BloodFormPayload (server/src/services/blood-form.ts) — kept as a plain type
// here so the shared generator has no server dependency.
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
  missingFields: string[];
};
