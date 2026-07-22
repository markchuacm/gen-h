import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import "./datePicker.css";

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type PickerMode = "days" | "years" | "months";

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

function parseDisplayDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  return parseIsoDate(`${match[3]}-${match[2]}-${match[1]}`);
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  return date
    ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
    : "";
}

function sameDate(first: Date | null, second: Date | null): boolean {
  return Boolean(first && second && toIsoDate(first) === toIsoDate(second));
}

function DatePicker({ id, value, onChange, className, disabled = false }: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDate = parseIsoDate(value);
  const [draft, setDraft] = useState(() => formatDisplayDate(value));
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const [mode, setMode] = useState<PickerMode>("days");
  const yearGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(formatDisplayDate(value));
    const nextSelected = parseIsoDate(value);
    if (nextSelected && !open) setViewDate(nextSelected);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDocumentPointerDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (mode !== "years") return;
    const selectedYear = yearGridRef.current?.querySelector(
      `[data-year="${viewDate.getFullYear()}"]`,
    ) as HTMLElement | null;
    if (selectedYear && typeof selectedYear.scrollIntoView === "function") {
      selectedYear.scrollIntoView({ block: "center" });
    }
  }, [mode, viewDate]);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const dayCount = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const cellCount = mondayOffset + dayCount <= 35 ? 35 : 42;
    return Array.from({ length: cellCount }, (_, index) =>
      new Date(viewDate.getFullYear(), viewDate.getMonth(), index - mondayOffset + 1),
    );
  }, [viewDate]);

  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(viewDate);
  const today = new Date();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);

  const openPicker = () => {
    if (disabled) return;
    const nextView = parseIsoDate(value) ?? new Date();
    setViewDate(nextView);
    setMode("days");
    setOpen(true);
  };

  const selectDate = (date: Date) => {
    const nextValue = toIsoDate(date);
    setDraft(formatDisplayDate(nextValue));
    onChange(nextValue);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleDraftChange = (nextDraft: string) => {
    const next = nextDraft.replace(/[^\d/]/g, "").slice(0, 10);
    setDraft(next);
    if (!next) {
      onChange("");
      return;
    }
    const parsed = parseDisplayDate(next);
    if (parsed) {
      onChange(toIsoDate(parsed));
      setViewDate(parsed);
    }
  };

  const handleDraftBlur = () => {
    if (!draft) {
      onChange("");
      return;
    }
    if (!parseDisplayDate(draft)) setDraft(formatDisplayDate(value));
  };

  return (
    <div className={`pf-date-picker ${open ? "is-open" : ""}`} ref={rootRef}>
      <div className="pf-date-picker-control">
        <input
          ref={inputRef}
          id={id}
          className={[className, "pf-date-picker-input"].filter(Boolean).join(" ")}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="DD/MM/YYYY"
          value={draft}
          disabled={disabled}
          onClick={openPicker}
          onChange={(event) => handleDraftChange(event.target.value)}
          onBlur={handleDraftBlur}
        />
        <button
          className="pf-date-picker-trigger"
          type="button"
          aria-label="Open date picker"
          aria-haspopup="dialog"
          aria-controls={`${id}-calendar`}
          aria-expanded={open}
          disabled={disabled}
          onClick={openPicker}
        >
          <CalendarDays strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="pf-date-picker-popover" id={`${id}-calendar`} role="dialog" aria-label="Choose date">
          <div className="pf-date-picker-header">
            {mode === "years" ? (
              <strong aria-live="polite">Select year</strong>
            ) : (
              <button
                className="pf-date-picker-period"
                type="button"
                aria-label="Choose month and year"
                onClick={() => setMode("years")}
              >
                {mode === "months" ? viewDate.getFullYear() : monthLabel}
              </button>
            )}
            <div className="pf-date-picker-month-controls">
              {mode === "days" ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  >
                    <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  >
                    <ChevronRight strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button className="pf-date-picker-back" type="button" aria-label="Back to calendar" onClick={() => setMode("days")}>
                  <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {mode === "years" && (
            <div className="pf-date-picker-years" ref={yearGridRef} aria-label="Choose year">
              {years.map((year) => (
                <button
                  key={year}
                  className={`pf-date-picker-year ${year === viewDate.getFullYear() ? "is-selected" : ""}`}
                  data-year={year}
                  type="button"
                  aria-pressed={year === viewDate.getFullYear()}
                  onClick={() => {
                    setViewDate(new Date(year, viewDate.getMonth(), 1));
                    setMode("months");
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
          {mode === "months" && (
            <div className="pf-date-picker-months" aria-label="Choose month">
              {MONTHS.map((month, monthIndex) => (
                <button
                  key={month}
                  className={`pf-date-picker-month ${monthIndex === viewDate.getMonth() ? "is-selected" : ""}`}
                  type="button"
                  aria-pressed={monthIndex === viewDate.getMonth()}
                  onClick={() => {
                    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
                    setMode("days");
                  }}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
          {mode === "days" && (
            <>
              <div className="pf-date-picker-weekdays" aria-hidden="true">
                {WEEKDAYS.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
              </div>
              <div className="pf-date-picker-days">
                {calendarDays.map((date) => {
                  const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                  const isSelected = sameDate(date, selectedDate);
                  const isToday = sameDate(date, today);
                  return (
                    <button
                      key={toIsoDate(date)}
                      className={`pf-date-picker-day ${isCurrentMonth ? "" : "is-outside"} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                      type="button"
                      aria-label={date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      aria-pressed={isSelected}
                      onClick={() => selectDate(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DatePicker;
