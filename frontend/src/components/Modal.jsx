import { useEffect } from "react";
import { FiX } from "react-icons/fi";

/** Accessible modal used for confirmations and detail views. */
export default function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`max-h-[calc(100dvh-1.5rem)] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          {title && (
            <h3 className="min-w-0 break-words text-lg font-semibold text-ink">{title}</h3>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-2 sm:gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}