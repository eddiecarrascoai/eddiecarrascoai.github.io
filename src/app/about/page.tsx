import type { Metadata } from "next";

import NotionBlocks from "@/components/notion/NotionBlocks";
import PrintButton from "@/components/PrintButton";
import { getCV, formatRange } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Experience, education, and skills — machine learning engineering " +
    "and product management.",
};

export default function About() {
  const sections = getCV();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Eddie Carrasco
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            ML engineer and product manager. I work where the model meets
            the roadmap — training and shipping systems, and deciding
            which problems are worth a model at all.
          </p>
        </div>

        <PrintButton />
      </header>

      {/*
        Each section comes from the Section select in Notion, ordered by
        SECTION_ORDER in the sync script rather than by whatever order
        Notion returns. Adding a new option never reshuffles the page.
      */}
      {sections.map((section) => (
        <section key={section.name} className="mt-14">
          <h2 className="border-b border-rule pb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent-rust">
            {section.name}
          </h2>

          <div className="mt-6 space-y-8">
            {section.entries.map((entry) => (
              <article key={entry.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {entry.title}
                  </h3>
                  {entry.start && (
                    <span className="font-mono text-xs tabular-nums text-ink-muted">
                      {formatRange(entry.start, entry.end)}
                    </span>
                  )}
                </div>

                {(entry.organization || entry.location) && (
                  <p className="mt-1 text-sm text-ink-soft">
                    {entry.organization}
                    {entry.organization && entry.location && " · "}
                    {entry.location}
                  </p>
                )}

                {/* Bullets written in the Notion page body. */}
                {entry.blocks.length > 0 && (
                  <div className="mt-2 text-[0.95rem] [&_li]:my-1 [&_p]:my-2 [&_ul]:my-2">
                    <NotionBlocks blocks={entry.blocks} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {sections.length === 0 && (
        <p className="mt-14 text-ink-muted">
          No CV entries published yet.
        </p>
      )}
    </div>
  );
}
