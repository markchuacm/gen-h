import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  COMMON_ISO,
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryByIso,
  flagEmoji,
  matchCountry,
  type Country,
} from "./countries";
import "./phoneField.css";

/** Derive a yyyy-mm-dd date of birth from a Malaysian IC: the first six digits
 *  are YYMMDD. Returns null when the digits don't form a real date. The century
 *  is inferred — a two-digit year greater than the current one is treated as
 *  1900s, otherwise 2000s. */
export function dobFromIc(ic: string): string | null {
  const digits = ic.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const nowYY = new Date().getFullYear() % 100;
  const year = yy > nowYY ? 1900 + yy : 2000 + yy;
  const iso = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCMonth() + 1 !== mm || parsed.getUTCDate() !== dd) {
    return null;
  }
  return iso;
}

/** The member's preferred name defaults to the first word of their full name,
 *  in normal caps ("AMINA BINTI …" → "Amina"). */
export function firstNameFromFull(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** Split a stored phone like "+60123456789" into a country code and the rest.
 *  Kept for callers/tests that only need the dial + national parts. */
export function splitPhone(value: string): { code: string; national: string } {
  const { country, national } = matchCountry(value);
  return { code: country.dial, national };
}

/** Recombine a dial code and national number into a stored phone value.
 *  An empty national number stores an empty string (no bare country code). */
export function combinePhone(code: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  return digits ? `${code}${digits}` : "";
}

export function PhoneField({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [iso, setIso] = useState(() => matchCountry(value).country.iso);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const country = countryByIso(iso) ?? DEFAULT_COUNTRY;
  const national = value.startsWith(country.dial)
    ? value.slice(country.dial.length).replace(/\D/g, "")
    : matchCountry(value).national;

  // Keep the flag in sync when the value is (re)populated externally (e.g. a
  // prefill fetch) with a different country's dial code.
  useEffect(() => {
    if (!value) return;
    if (value.startsWith(country.dial)) return;
    const matched = matchCountry(value).country;
    if (matched.iso !== iso) setIso(matched.iso);
  }, [value, country.dial, iso]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDocClick);
    document.addEventListener("keydown", onKey);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const common = COMMON_ISO.map((code) => countryByIso(code)).filter(Boolean) as Country[];
      const rest = COUNTRIES.filter((c) => !COMMON_ISO.includes(c.iso)).sort((a, b) => a.name.localeCompare(b.name));
      return [...common, ...rest];
    }
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const selectCountry = (c: Country) => {
    setIso(c.iso);
    setOpen(false);
    setQuery("");
    onChange(combinePhone(c.dial, national));
  };

  return (
    <div className={`pf-phone ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="pf-phone-trigger"
        aria-label={`Country code: ${country.name} ${country.dial}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pf-phone-flag" aria-hidden="true">{flagEmoji(country.iso)}</span>
        <ChevronDown className="pf-phone-caret" aria-hidden="true" />
      </button>
      <div className="pf-phone-entry">
        <span className="pf-phone-dial" aria-hidden="true">{country.dial}</span>
        <input
          id={id}
          className="pf-phone-number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={national}
          onChange={(event) => onChange(combinePhone(country.dial, event.target.value))}
        />
      </div>
      {open && (
        <div className="pf-phone-menu" role="dialog" aria-label="Select country">
          <div className="pf-phone-search">
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search for country"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <ul className="pf-phone-list">
            {list.map((c) => (
              <li key={c.iso}>
                <button
                  type="button"
                  className={`pf-phone-option ${c.iso === country.iso ? "is-selected" : ""}`}
                  onClick={() => selectCountry(c)}
                >
                  <span className="pf-phone-option-flag" aria-hidden="true">{flagEmoji(c.iso)}</span>
                  <span className="pf-phone-option-name">{c.name}</span>
                  <span className="pf-phone-option-dial">{c.dial}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="pf-phone-empty">No countries found</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
