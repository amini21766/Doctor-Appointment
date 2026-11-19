import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";
import { COUNTRIES, countryFlag } from "../utils/countries.js";

/**
 * Searchable country dial-code picker with flags.
 * Designed to sit inline at the start of a phone input, so the panel is
 * absolutely positioned and must not be clipped by the parent container.
 */
export default function CountrySelect({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const options = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return COUNTRIES;
    const digits = term.replace(/\D/g, "");
    return COUNTRIES.filter(
      ({ name, iso, dial }) =>
        name.toLowerCase().includes(term) ||
        iso.toLowerCase() === term ||
        (digits && dial.replace(/\D/g, "").includes(digits))
    );
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  };

  const handleSelect = (country) => {
    onChange(country);
    close();
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country dial code: ${value.name}, ${value.dial}`}
        className="flex items-center gap-1.5 rounded-l-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {countryFlag(value.iso)}
        </span>
        <span className="tabular-nums">{value.dial}</span>
        <FiChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-4rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <FiSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (options.length > 0) handleSelect(options[0]);
                }}
                placeholder="Search country or code"
                aria-label="Search countries"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          <ul role="listbox" aria-label="Country dial codes" className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No countries found</li>
            ) : (
              options.map((country) => {
                const selected = country.iso === value.iso;
                return (
                  <li key={country.iso}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleSelect(country)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${
                        selected ? "text-primary" : "text-slate-700"
                      }`}
                    >
                      <span aria-hidden="true" className="text-base leading-none">
                        {countryFlag(country.iso)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{country.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">{country.dial}</span>
                      {selected && <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
