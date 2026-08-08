import type { Metadata } from "next";

import ProjectFilter from "@/components/ProjectFilter";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Applied machine learning projects: PyTorch, Hugging Face, Flask, " +
    "and interactive data visualization.",
};

export default function PortfolioIndex() {
  const projects = getProjects();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Portfolio
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Models, pipelines, and visualizations. Each has a repo; most
          have something you can click.
        </p>
      </header>

      <ProjectFilter projects={projects} />
    </div>
  );
}
