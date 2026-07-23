import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { fetchMemberAppointment, formatConsultDate, formatConsultTime } from "../../../lib/api/appointments";
import type { MemberAppointment } from "../../../lib/api/appointments";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ProfileCompleteDialogProps = {
  /** The member's preferred name, used to warm the thank-you line. */
  preferredName: string;
  onClose: () => void;
};

/** Shown once, overlaid on the brief summary, right after a member finishes
    the brief flow: the hand-off moment between "I answered questions" and
    "I'm getting ready for a consult". */
function ProfileCompleteDialog({ preferredName, onClose }: ProfileCompleteDialogProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [appointment, setAppointment] = useState<MemberAppointment | null>(null);
  const titleId = useId();
  const copyId = useId();

  useEffect(() => {
    let cancelled = false;
    void fetchMemberAppointment().then(({ data }) => {
      if (!cancelled) setAppointment(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const name = preferredName.trim();
  const scheduledAt = appointment?.scheduled_at ?? null;
  const doctorName = appointment?.doctor_name?.trim() || "your Verae doctor";

  return createPortal(
    <div className={`p-pending-layer pf-done-layer${isClosing ? " is-closing" : ""}`} role="presentation">
      <button
        className="p-pending-backdrop"
        type="button"
        aria-label="Close"
        onClick={requestClose}
      />
      <section
        className="p-pending-dialog pf-done-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={copyId}
      >
        <span className="p-eyebrow pf-done-eyebrow">Brief sent</span>
        <h2 id={titleId}>{name ? `Thank you, ${name}` : "Thank you for sharing"}</h2>
        <p className="pf-done-lede" id={copyId}>
          Your brief is with {doctorName}. All that&rsquo;s left is to get ready for your consult.
        </p>

        <div className="pf-done-consult">
          <p className="pf-done-consult-line">
            <CalendarDays aria-hidden="true" />
            <span>{scheduledAt ? formatConsultDate(scheduledAt) : "Date to be confirmed"}</span>
          </p>
          <p className="pf-done-consult-line">
            <Clock aria-hidden="true" />
            <span>{scheduledAt ? formatConsultTime(scheduledAt) : "Time to be confirmed"}</span>
          </p>
          <p className="pf-done-consult-line">
            <MapPin aria-hidden="true" />
            <span>Online — Google Meet link in your Home tab</span>
          </p>
        </div>

        <div className="p-pending-actions pf-done-actions">
          <button className="p-btn" type="button" onClick={requestClose} autoFocus>
            See my answers
          </button>
          <p className="pf-done-footnote">You can change any answer before the consult.</p>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default ProfileCompleteDialog;
