import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type PendingPortalDialogProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
};

function PendingPortalDialog({
  eyebrow,
  title,
  children,
  closeLabel,
  onClose,
}: PendingPortalDialogProps) {
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useId();
  const copyId = useId();

  const requestClose = () => {
    if (isClosing) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      onClose();
      return;
    }
    setIsClosing(true);
    window.setTimeout(onClose, 170);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return createPortal(
    <div className={`p-pending-layer${isClosing ? " is-closing" : ""}`} role="presentation">
      <button
        className="p-pending-backdrop"
        type="button"
        aria-label={closeLabel}
        onClick={requestClose}
      />
      <section
        className="p-pending-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={copyId}
      >
        {eyebrow && <span className="p-eyebrow p-pending-eyebrow">{eyebrow}</span>}
        <h2 id={titleId}>{title}</h2>
        <p id={copyId}>{children}</p>
        <div className="p-pending-actions">
          <button className="p-btn" type="button" onClick={requestClose} autoFocus>
            Got it
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default PendingPortalDialog;
