import { useEffect, useState } from "react";
import MarkdownContent from "./MarkdownContent";
import { LEGAL_DOCUMENTS, type LegalDocument } from "./legalDocuments";

type LegalLanguage = "en" | "bm";

function initialLanguage(): LegalLanguage {
  return new URLSearchParams(window.location.search).get("lang") === "bm" ? "bm" : "en";
}

export default function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const [language, setLanguage] = useState<LegalLanguage>(initialLanguage);
  const isBm = language === "bm";
  const pageTitle = isBm ? document.titleBm : document.title;

  useEffect(() => {
    const previousTitle = window.document.title;
    const previousLanguage = window.document.documentElement.lang;
    window.document.title = `${pageTitle} | Verae Health`;
    window.document.documentElement.lang = isBm ? "ms" : "en";
    window.scrollTo(0, 0);
    return () => {
      window.document.title = previousTitle;
      window.document.documentElement.lang = previousLanguage;
    };
  }, [isBm, pageTitle]);

  function selectLanguage(nextLanguage: LegalLanguage) {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    const url = new URL(window.location.href);
    if (nextLanguage === "bm") url.searchParams.set("lang", "bm");
    else url.searchParams.delete("lang");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <a className="legal-page-wordmark" href="/" aria-label="Verae Health home">Verae</a>
        <div className="legal-page-header-actions">
          <div className="legal-language-toggle" role="group" aria-label="Document language">
            <button type="button" className={!isBm ? "is-active" : undefined} aria-pressed={!isBm} onClick={() => selectLanguage("en")}>EN</button>
            <span aria-hidden="true">|</span>
            <button type="button" className={isBm ? "is-active" : undefined} aria-pressed={isBm} onClick={() => selectLanguage("bm")}>BM</button>
          </div>
          <a className="legal-page-back" href="/">{isBm ? "Laman utama" : "Back to home"}</a>
        </div>
      </header>
      <main className="legal-page-main" lang={isBm ? "ms" : "en"}>
        <MarkdownContent source={isBm ? document.contentBm : document.content} />
      </main>
      <footer className="legal-page-footer">
        <a className="legal-page-footer-wordmark" href="/" aria-label="Verae Health home">Verae</a>
        <nav aria-label={isBm ? "Dokumen undang-undang" : "Legal documents"}>
          {LEGAL_DOCUMENTS.map((item) => (
            <a key={item.path} href={isBm ? `${item.path}?lang=bm` : item.path} aria-current={item.path === document.path ? "page" : undefined}>
              {isBm ? item.titleBm : item.title}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
