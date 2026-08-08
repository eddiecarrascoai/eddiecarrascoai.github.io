"use client";

import { useState } from "react";
import Link from "next/link";

import type { Project } from "@/types/content";

/**
 * The only client component on the site.
 *
 * Everything else renders to static HTML with zero JavaScript. This one
 * earns its bundle: a hiring manager scanning for "PyTorch" or "Flask"
 * shouldn't have to read every card. The list itself is passed in as a
 * prop from a Server Component, so no data fetching happens here.
 */
export default function ProjectFilter({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string | null>(null);

  const allTech = [...new Set(projects.flatMap((p) => p.tech))].sort();

  const visible = active
    ? projects.filter((p) => p.tech.includes(active))
    : projects;

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
        <FilterChip
          label="All"
          active={active === null}
          onClick={() => setActive(null)}
        />
        {allTech.map((tech) => (
          <FilterChip
            key={tech}
            label={tech}
            active={active === tech}
            onClick={() => setActive(active === tech ? null : tech)}
          />
        ))}
      </div>

      {/* Announced to screen readers when the count changes, so filtering
          isn't a silent visual-only event. */}
      <p className="sr-only" role="status">
        {visible.length} project{visible.length === 1 ? "" : "s"} shown
      </p>

      <ul className="mt-12 space-y-px">
        {visible.map((project) => (
          <li key={project.id} className="border-t border-rule py-8">
            <Link href={`/portfolio/${project.slug}`} className="group block">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-indigo">
                  {project.title}
                </h2>
                {project.category && (
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-rust">
                    {project.category}
                  </span>
                )}
              </div>

              <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
                {project.excerpt}
              </p>

              <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink-muted">
                {project.tech.join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-12 border-t border-rule pt-8 text-ink-muted">
          No projects use {active}.
        </p>
      )}
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-accent-indigo bg-accent-indigo px-3 py-1 font-mono text-xs uppercase tracking-wider text-surface"
          : "rounded-full border border-rule px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:border-accent-indigo hover:text-accent-indigo"
      }
    >
      {label}
    </button>
  );
}
