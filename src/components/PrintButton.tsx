"use client";

/**
 * Triggers the browser's print dialog, which the print styles in
 * globals.css turn into a clean single-column CV — nav and footer
 * hidden, links footnoted with their URLs.
 *
 * Cheaper than generating and hosting a PDF, and it can never fall out
 * of date with the Notion content the way an uploaded file would.
 */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full border border-rule px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:border-accent-indigo hover:text-accent-indigo"
    >
      Print / PDF
    </button>
  );
}
