import Image from "next/image";
import Link from "next/link";

import { getFeaturedProjects, getPosts, getLaws, formatDate } from "@/lib/content";

/**
 * The hero is a thesis, not a greeting.
 *
 * The interesting thing about this profile is the pairing — someone who
 * builds the systems and decides what gets built. So the hero states
 * that tension plainly and lets the three sections below prove it, one
 * per claim: projects (built), writing (thought about), laws (understood).
 *
 * No stat counters, no gradient. A hiring manager scanning for ten
 * seconds should leave knowing what this person does.
 */
export default function Home() {
  const projects = getFeaturedProjects(3);
  const posts = getPosts().slice(0, 2);
  const law = getLaws()[0];

  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="border-b border-rule py-24 sm:py-32">
        <div className="flex items-center gap-4">
          <Image
            src="/profile.jpeg"
            alt="Eddie Carrasco"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-full object-cover"
          />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-rust">
            ML Engineer · Product Manager · Entrepreneur
          </p>
        </div>

        <h1 className="mt-8 max-w-3xl font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-6xl">
          I build and scale AI systems from a product perspective, not just a model.
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
          Most ML projects fail on the second question, not the first.
          I work on both — model and pipeline on one side, scope and
          tradeoffs on the other.
        </p>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link
            href="/portfolio"
            className="border-b border-accent-indigo pb-0.5 text-accent-indigo transition-colors hover:border-ink hover:text-ink"
          >
            See the work
          </Link>
          <Link
            href="/about"
            className="border-b border-rule pb-0.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            Read the CV
          </Link>
        </div>
      </section>

      {/* Selected work */}
      <section className="border-b border-rule py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Selected work
          </h2>
          <Link
            href="/portfolio"
            className="font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-accent-indigo"
          >
            All projects →
          </Link>
        </div>

        <ul className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/portfolio/${project.slug}`} className="group block">
                <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-accent-indigo">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {project.excerpt}
                </p>
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-muted">
                  {project.tech.slice(0, 3).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* One law, pulled forward. This is the section that distinguishes
          the site, so it gets space rather than a card in a grid. */}
      {law && (
        <section className="border-b border-rule py-16">
          <Link href={`/laws/${law.slug}`} className="group block sm:grid sm:grid-cols-[8rem_1fr] sm:gap-10">
            <p className="font-mono text-xs uppercase tracking-wider text-accent-rust">
              Laws of AI
            </p>
            <div className="mt-4 sm:mt-0">
              <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
                {law.statement}
              </p>
              <p className="mt-5 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors group-hover:text-accent-indigo">
                {law.title} →
              </p>
            </div>
          </Link>
        </section>
      )}

      {/* Recent writing */}
      <section className="py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Recent writing
          </h2>
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-accent-indigo"
          >
            All posts →
          </Link>
        </div>

        <ul className="mt-8 space-y-px">
          {posts.map((post) => (
            <li key={post.id} className="border-t border-rule py-6">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h3 className="font-display text-xl font-semibold text-ink transition-colors group-hover:text-accent-indigo">
                  {post.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-soft">
                  {post.excerpt}
                </p>
                <p className="mt-3 font-mono text-xs text-ink-muted">
                  {formatDate(post.published)} · {post.readingTime} min read
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
