import { useEffect, useState } from "react";
import { fetchCaseDetail } from "../lib/api/doctor";
import type { DoctorCase, DoctorCaseDetail } from "../lib/api/doctor";
import { createDocumentSignedUrl } from "../lib/api/healthDocuments";
import CarePlanEditor from "./CarePlanEditor";

function CaseDetail({
  memberId,
  caseSummary,
  onBack,
}: {
  memberId: string;
  caseSummary?: DoctorCase;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<DoctorCaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchCaseDetail(memberId).then(({ data, error: err }) => {
      if (err) setError(err);
      else setDetail(data);
    });
  }, [memberId]);

  const openDoc = async (storagePath: string) => {
    const { url } = await createDocumentSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener");
  };

  if (editing) {
    return (
      <CarePlanEditor
        memberId={memberId}
        memberName={detail?.memberName ?? caseSummary?.memberName ?? null}
        onBack={() => setEditing(false)}
      />
    );
  }

  return (
    <main className="doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← All cases
      </button>

      {error && <p role="alert" className="doc-error">Couldn't load case ({error}).</p>}
      {!detail && !error && <p className="doc-muted">Loading…</p>}

      {detail && (
        <>
          <header className="doc-head">
            <div>
              <span className="doc-eyebrow">CASE</span>
              <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
              <p className="doc-sub">
                {[detail.age ? `${detail.age}y` : null, detail.sex, detail.stage]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button type="button" className="doc-primary" onClick={() => setEditing(true)}>
              Edit care plan
            </button>
          </header>

          <section className="doc-card">
            <h2>Health profile</h2>
            {Object.keys(detail.onboarding).length === 0 ? (
              <p className="doc-muted">No onboarding responses yet.</p>
            ) : (
              <dl className="doc-answers">
                {Object.entries(detail.onboarding).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="doc-card">
            <h2>Documents</h2>
            {detail.documents.length === 0 ? (
              <p className="doc-muted">No documents uploaded.</p>
            ) : (
              <ul className="doc-doc-list">
                {detail.documents.map((doc) => (
                  <li key={doc.id}>
                    <button type="button" onClick={() => void openDoc(doc.storage_path)}>
                      {doc.file_name}
                    </button>
                    <span>{doc.doc_type}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default CaseDetail;
