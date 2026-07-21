/* Dev-only visual harness for the PanelBuilder tiles and the member-facing
   quote dialog. Served at /panel-preview.html; never linked from the app. */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, FlaskConical, HeartPulse, Plus } from "lucide-react";
import "../member-v2/tokens.css";
import "../member-v2/shell/shell.css";
import "../doctor/doctor.css";
import { PanelQuote } from "../doctor/PanelBuilder";
import type { LabOrderQuote } from "../lib/api/labOrder";

const quote: LabOrderQuote = {
  pricingVersion: 1,
  currency: "MYR",
  catalogCount: 68,
  selectedCount: 61,
  baseAmountMinor: 140000,
  personalizationDiscountMinor: 9000,
  foundingDiscountMinor: 26000,
  isFoundingMember: true,
  totalAmountMinor: 105000,
  quotedAt: new Date().toISOString(),
};

const areas = [
  ["Cardiovascular risk", "Included", "is-active"],
  ["Metabolic health", "Included", "is-active"],
  ["Blood, inflammation & immunity", "Included", "is-covered"],
  ["Kidney & urinary health", "Partially covered", "is-partial"],
  ["Liver & digestive health", "Included", "is-active"],
  ["Thyroid, hormones & ageing", "Included", "is-covered"],
  ["Nutrients & bone health", "Removed", ""],
  ["Infectious disease screening", "Included", "is-active"],
  ["Life-stage risk", "Partially covered", "is-partial"],
] as const;

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <main className="p-page doc-page">
      <h1 className="p-h1">Harness</h1>
      <section aria-label="Health-risk coverage">
        <div className="pb-panels">
          <button type="button" className="pb-panel pb-panel-baseline is-active">
            <span className="pb-panel-head">
              <span><strong>Advanced Baseline</strong></span>
              <span className="pb-baseline-action" aria-hidden="true"><Check strokeWidth={2.2} /></span>
            </span>
            <span className="pb-panel-meta">
              <span className="pb-panel-status">Included</span>
              <FlaskConical className="pb-panel-icon" strokeWidth={1.7} aria-hidden="true" />
            </span>
          </button>
          {areas.map(([name, status, cls]) => (
            <button key={name} type="button" className={`pb-panel ${cls}`}>
              <span className="pb-panel-head"><span><strong>{name}</strong></span></span>
              <span className="pb-panel-meta">
                <span className="pb-panel-status">{status}</span>
                <HeartPulse className="pb-panel-icon" strokeWidth={1.7} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>
      <button type="button" className="p-btn" onClick={() => setOpen(true)}>
        <Plus strokeWidth={2} /> Show quote
      </button>
      {open && <PanelQuote quote={quote} onEdit={() => setOpen(false)} onDone={() => setOpen(false)} />}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
