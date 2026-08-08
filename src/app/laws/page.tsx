import type { Metadata } from "next";
import Link from "next/link";

import { getLaws } from "@/lib/content";

export const metadata: Metadata = {
  title: "Laws of AI",
  description:
    "Constraints in machine learning that hold across architectures and " +
    "scales — what they claim, and where they stop.",
};

export default function LawsIndex() {
  const laws = getLaws();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Laws of AI
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Constraints that hold across architectures, scales, and hype
          cycles. Each states a relationship, then marks where it breaks
          down — a law with no boundary conditions is a slogan.
        </p>
      </header>

      {/*
        The statement is the object here, not the title. Set large, in the
        display face, with the number as a quiet index in the margin. The
        essay behind it is secondary — this page should reward reading
        without clicking anything.
      */}
      <ol className="mt-16 space-y-px">
        {laws.map((law) => (
          <li key={law.id}>
            <Link
              href={`/laws/${law.slug}`}
              className="group block border-t border-rule py-10 transition-colors hover:bg-surface-sunk/60 sm:grid sm:grid-cols-[4rem_1fr] sm:gap-8"
            >
              <span
                className="font-mono text-sm tabular-nums text-accent-rust"
                aria-hidden="true"
              >
                {String(law.number).padStart(2, "0")}
              </span>

              <div>
                <p className="font-display text-2xl leading-snug text-ink sm:text-[1.75rem]">
                  {law.statement}
                </p>

                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                  <span className="text-ink-soft transition-colors group-hover:text-accent-indigo">
                    {law.title}
                  </span>
                  {law.domain && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-xs uppercase tracking-wider">
                        {law.domain}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {laws.length === 0 && (
        <p className="mt-16 border-t border-rule pt-10 text-ink-muted">
          No laws published yet. Set a row to Published in Notion and run{" "}
          <code className="font-mono text-sm">npm run sync</code>.
        </p>
      )}
    </div>
  );
}
