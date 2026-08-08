import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import NotionBlocks from "@/components/notion/NotionBlocks";
import { getLaw, getLaws } from "@/lib/content";

/**
 * Tells Next which URLs to build. Under `output: "export"` this is
 * required for every dynamic segment — without it the build fails,
 * since there is no server to render unknown slugs on demand.
 */
export async function generateStaticParams() {
  return getLaws().map((law) => ({ slug: law.slug }));
}

/**
 * Any slug not returned above 404s at build time rather than being
 * attempted. This is the default under static export; stating it makes
 * the intent explicit.
 */
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const law = getLaw(slug);
  if (!law) return {};

  return {
    title: law.title,
    description: law.statement,
    openGraph: {
      title: law.title,
      description: law.statement,
      images: law.cover ? [law.cover] : undefined,
    },
  };
}

export default async function LawPage({ params }: Props) {
  const { slug } = await params;
  const law = getLaw(slug);
  if (!law) notFound();

  const laws = getLaws();
  const index = laws.findIndex((l) => l.id === law.id);
  const next = laws[index + 1];

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/laws"
        className="font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-accent-indigo"
      >
        ← Laws of AI
      </Link>

      <header className="mt-10">
        <p className="font-mono text-sm tabular-nums text-accent-rust">
          {String(law.number).padStart(2, "0")}
          {law.domain && (
            <span className="ml-3 text-ink-muted">{law.domain}</span>
          )}
        </p>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {law.title}
        </h1>

        {/* The statement, set apart. This is the page's thesis and should
            be readable on its own before any of the argument. */}
        <p className="mt-8 border-l-2 border-accent-rust pl-6 font-display text-xl leading-relaxed text-ink-soft sm:text-2xl">
          {law.statement}
        </p>
      </header>

      <div className="mt-14">
        <NotionBlocks blocks={law.blocks} />
      </div>

      {next && (
        <nav className="mt-20 border-t border-rule pt-8">
          <Link href={`/laws/${next.slug}`} className="group block">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Next
            </span>
            <p className="mt-2 font-display text-xl text-ink transition-colors group-hover:text-accent-indigo">
              {next.title}
            </p>
          </Link>
        </nav>
      )}
    </article>
  );
}
