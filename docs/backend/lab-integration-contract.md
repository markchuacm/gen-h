# Verae laboratory result intake v1

Share this document only after Verae and the laboratory agree the transport and adapter mapping. The endpoint infrastructure is ready now; Innoquest-specific HL7 mapping remains quarantined until approved sample messages are supplied.

## UAT and production addresses

```text
UAT:        POST https://api-uat.veraehealth.com/v1/labs/innoquest/results
Production: POST https://api.veraehealth.com/v1/labs/innoquest/results
```

The sender must transmit the exact body bytes used to calculate the signature.

## Required headers

```text
Content-Type: application/json
X-Verae-Event-ID: iq-20260715-000001
X-Verae-Timestamp: 2026-07-15T04:30:00.000Z
X-Verae-Signature: v1=<lowercase HMAC-SHA256 hex>
```

The signature input is:

```text
HMAC_SHA256(shared_secret, X-Verae-Timestamp + "." + exact_request_body_bytes)
```

Timestamps must be UTC and within five minutes. Secrets are different in UAT and production and are exchanged outside email/chat where possible.

## Canonical JSON payload used before partner adapters

```json
{
  "schema_version": "1.0",
  "event_id": "iq-20260715-000001",
  "event_type": "lab_result.final",
  "occurred_at": "2026-07-15T04:25:00.000Z",
  "order": {
    "client_order_id": "<opaque ID supplied by Verae>",
    "lab_order_id": "IQ-ORDER-123",
    "accession_number": "ACC-123"
  },
  "patient": {
    "lab_patient_id": "IQ-PATIENT-456"
  },
  "report": {
    "report_id": "IQ-REPORT-789",
    "version": 1,
    "status": "final",
    "issued_at": "2026-07-15T04:25:00.000Z",
    "observations": [
      {
        "source_code": "HBA1C",
        "source_system": "INNOQUEST",
        "name": "HbA1c",
        "value": "5.4",
        "unit": "%",
        "reference_range": { "low": 4.0, "high": 5.6, "text": "4.0-5.6" },
        "flag": "N",
        "status": "final",
        "observed_at": "2026-07-15T03:50:00.000Z"
      }
    ]
  }
}
```

No member name, email, NRIC, or date of birth is used to select the Verae member. `client_order_id` is the required link. Laboratory identifiers are stored only as source identifiers.

## Responses and idempotency

A successful durable receipt is returned only after the exact raw bytes and SHA-256 checksum are committed:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "receipt_id": "c0c89e47-3a55-4fe1-b834-03dd1325c855",
  "event_id": "iq-20260715-000001",
  "status": "accepted",
  "received_at": "2026-07-15T04:30:01.120Z"
}
```

- Retrying the same event ID with identical bytes returns the existing receipt and is safe.
- Reusing an event ID with different bytes returns `409 EVENT_ID_CONFLICT` and creates an issue.
- Missing/invalid authentication returns 401; stale timestamp 401; body too large 413.
- Schema, mapping, order-link, or correction ambiguity is processed into quarantine rather than guessed.

## Corrections

Use a new event ID and increment `report.version`. Set `event_type` and `report.status` to `amended`, `corrected`, `cancelled`, or `entered_in_error` as appropriate. Verae appends the new report version and links it to the superseded version; history is never overwritten.

## Information Verae needs from Innoquest

- Transport: HTTPS push, MLLP, SFTP, or another mechanism.
- Three de-identified ORU examples: normal, abnormal/critical, and multi-panel.
- A corrected/amended report and cancellation example.
- HL7 version, delimiters/encoding, message profile, ACK expectations, and retry policy.
- Sending facility/application identifiers and event/message ID field.
- Order, accession, report, patient, observation, unit, reference-range, status, and time field locations.
- Complete test-code/unit catalogue and whether units may vary for one code.
- Preliminary/final/correction lifecycle and version semantics.
- UAT source IP ranges if IP allowlisting is desired.

Verae will then create a versioned mapping, run invented/de-identified fixtures through quarantine, and issue UAT credentials. Production credentials are issued only after both teams sign off the expected receipts, duplicates, unknown codes, corrections, and failure behaviour.
