/**
 * The only place the app reads /content.
 *
 * Everything here is synchronous file reading at build time. Under
 * `output: "export"` these run during `next build` and never in a
 * browser — the JSON is not shipped to the client, only the rendered
 * HTML for each page.
 *
 * Results are memoized per process so a build with 30 posts parses each
 * JSON file once rather than once per page.
 */

import fs from "node:fs";
import path from "node:path";

import type {
  BlogPost,
  Project,
  Law,
  CVSection,
} from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "content");

const cache = new Map<string, unknown>();

function load<T>(filename: string): T {
  const cached = cache.get(filename);
  if (cached) return cached as T;

  const file = path.join(CONTENT_DIR, filename);

  if (!fs.existsSync(file)) {
    throw new Error(
      `${filename} not found. Run "npm run sync" to pull content from Notion.`
    );
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  cache.set(filename, data);
  return data;
}

/* ------------------------------------------------------------------ */

export function getPosts(): BlogPost[] {
  return load<BlogPost[]>("blog.json");
}

export function getPost(slug: string): BlogPost | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function getProjects(): Project[] {
  return load<Project[]>("portfolio.json");
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getFeaturedProjects(limit = 3): Project[] {
  return getProjects()
    .filter((p) => p.featured)
    .slice(0, limit);
}

export function getLaws(): Law[] {
  return load<Law[]>("laws.json");
}

export function getLaw(slug: string): Law | undefined {
  return getLaws().find((l) => l.slug === slug);
}

export function getCV(): CVSection[] {
  return load<CVSection[]>("cv.json");
}

/** Every distinct tech tag across projects, for filter chips. */
export function getAllTech(): string[] {
  const set = new Set<string>();
  for (const project of getProjects()) {
    for (const tech of project.tech) set.add(tech);
  }
  return [...set].sort();
}

/* ------------------------------------------------------------------ */

/** "March 2026" — used on cards and post headers. */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  // Parse as UTC. A bare "2026-03-14" parsed locally lands on the 13th
  // in US timezones, so dates near month boundaries display wrong.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", timeZone: "UTC" }
  );
}

/** "2023 — Present" for CV entries. */
export function formatRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const from = start.slice(0, 4);
  const to = end ? end.slice(0, 4) : "Present";
  return from === to ? from : `${from} — ${to}`;
}
