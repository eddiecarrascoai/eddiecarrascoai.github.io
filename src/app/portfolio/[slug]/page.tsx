import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import NotionBlocks from "@/components/notion/NotionBlocks";
import { getProject, getProjects, formatDate } from "@/lib/content";

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.excerpt,
    openGraph: {
      title: project.title,
      description: project.excerpt,
      images: project.cover ? [project.cover] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/portfolio"
        className="font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-accent-indigo"
      >
        ← Portfolio
      </Link>

      <header className="mt-10">
        {project.category && (
          <p className="font-mono text-xs uppercase tracking-wider text-accent-rust">
            {project.category}
          </p>
        )}

        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {project.title}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {project.excerpt}
        </p>

        <dl className="mt-8 grid gap-x-8 gap-y-4 border-y border-rule py-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Stack
            </dt>
            <dd className="mt-1 text-ink-soft">{project.tech.join(", ")}</dd>
          </div>

          {project.date && (
            <div>
              <dt className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Date
              </dt>
              <dd className="mt-1 text-ink-soft">{formatDate(project.date)}</dd>
            </div>
          )}

          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Links
            </dt>
            <dd className="mt-1 flex flex-col gap-1">
              {/* Rendered only when present, so an empty Notion field
                  produces no dead button. */}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo underline decoration-rule underline-offset-2 hover:decoration-accent-indigo"
                >
                  Source
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo underline decoration-rule underline-offset-2 hover:decoration-accent-indigo"
                >
                  Live demo
                </a>
              )}
              {!project.repoUrl && !project.demoUrl && (
                <span className="text-ink-muted">Private</span>
              )}
            </dd>
          </div>
        </dl>
      </header>

      {project.cover && (
        <Image
          src={project.cover}
          alt=""
          width={1600}
          height={900}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="mt-10 h-auto w-full rounded-lg border border-rule"
        />
      )}

      <div className="mt-12">
        <NotionBlocks blocks={project.blocks} />
      </div>
    </article>
  );
}
