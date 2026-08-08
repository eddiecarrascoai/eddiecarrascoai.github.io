/**
 * Pulls all four Notion databases into /content as JSON.
 *
 * Runs automatically before every build via the "prebuild" npm script.
 * Run it alone with: npm run sync
 *
 * Design note: this writes plain JSON to disk rather than fetching inside
 * React Server Components. Two reasons. Notion goes down sometimes and a
 * failed fetch mid-build produces a half-broken site; and a local JSON
 * file means `next dev` is instant instead of rate-limited. The content
 * layer is also portable — leave Notion and only this script changes.
 */

import "./env"; // MUST be first: loads .env.local before anything reads it

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { queryDatabase, fetchBlocks } from "./notion/client";
import { localizeImage, localizeBlockImages, saveCache } from "./notion/media";
import {
  getTitle,
  getText,
  getSelect,
  getMultiSelect,
  getDate,
  getDateEnd,
  getUrl,
  getCheckbox,
  getNumber,
  getSlug,
  getCoverUrl,
  estimateReadingTime,
} from "./notion/props";

import type {
  BlogPost,
  Project,
  Law,
  CVEntry,
  CVSection,
} from "../src/types/content";

const CONTENT_DIR = path.join(process.cwd(), "content");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add all four database IDs to .env.local ` +
        `(and to repository secrets for CI). See .env.local.example.`
    );
  }
  return value;
}

/**
 * Read lazily inside each sync function rather than at module scope.
 * Same reason the Notion client is lazy: module-level code runs during
 * import evaluation, which is before ./env has finished its work in
 * some execution orders.
 */
function databaseIds() {
  return {
    blog: requireEnv("NOTION_DB_BLOG"),
    portfolio: requireEnv("NOTION_DB_PORTFOLIO"),
    laws: requireEnv("NOTION_DB_LAWS"),
    cv: requireEnv("NOTION_DB_CV"),
  };
}

async function write(filename: string, data: unknown) {
  await mkdir(CONTENT_DIR, { recursive: true });
  await writeFile(
    path.join(CONTENT_DIR, filename),
    JSON.stringify(data, null, 2)
  );
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

async function syncBlog(dbId: string): Promise<BlogPost[]> {
  const pages = await queryDatabase(dbId, [
    { property: "Published", direction: "descending" },
  ]);

  const posts: BlogPost[] = [];

  for (const page of pages) {
    const props = page.properties;
    const title = getTitle(props);
    const blocks = await fetchBlocks(page.id);
    await localizeBlockImages(blocks);

    posts.push({
      id: page.id,
      title,
      slug: getSlug(props, title, `blog/${title}`),
      published: getDate(props, "Published"),
      excerpt: getText(props, "Excerpt"),
      tags: getMultiSelect(props, "Tags"),
      cover: await localizeImage(
        getCoverUrl(page),
        page.id,
        page.last_edited_time
      ),
      readingTime: estimateReadingTime(blocks),
      blocks,
    });
  }

  console.log(`  Blog: ${posts.length} posts`);
  return posts;
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

async function syncPortfolio(dbId: string): Promise<Project[]> {
  const pages = await queryDatabase(dbId, [
    { property: "Order", direction: "ascending" },
  ]);

  const projects: Project[] = [];

  for (const page of pages) {
    const props = page.properties;
    const title = getTitle(props);
    const blocks = await fetchBlocks(page.id);
    await localizeBlockImages(blocks);

    projects.push({
      id: page.id,
      title,
      slug: getSlug(props, title, `portfolio/${title}`),
      excerpt: getText(props, "Excerpt"),
      tech: getMultiSelect(props, "Tech"),
      category: getSelect(props, "Category"),
      repoUrl: getUrl(props, "Repo URL"),
      demoUrl: getUrl(props, "Demo URL"),
      featured: getCheckbox(props, "Featured"),
      order: getNumber(props, "Order") ?? 999,
      date: getDate(props, "Date"),
      cover: await localizeImage(
        getCoverUrl(page),
        page.id,
        page.last_edited_time
      ),
      blocks,
    });
  }

  console.log(`  Portfolio: ${projects.length} projects`);
  return projects;
}

/* ------------------------------------------------------------------ */
/* Laws of AI                                                          */
/* ------------------------------------------------------------------ */

async function syncLaws(dbId: string): Promise<Law[]> {
  const pages = await queryDatabase(dbId, [
    { property: "Number", direction: "ascending" },
  ]);

  const laws: Law[] = [];

  for (const page of pages) {
    const props = page.properties;
    const title = getTitle(props);
    const blocks = await fetchBlocks(page.id);
    await localizeBlockImages(blocks);

    laws.push({
      id: page.id,
      title,
      slug: getSlug(props, title, `laws/${title}`),
      number: getNumber(props, "Number") ?? 0,
      statement: getText(props, "Statement"),
      domain: getSelect(props, "Domain"),
      cover: await localizeImage(
        getCoverUrl(page),
        page.id,
        page.last_edited_time
      ),
      blocks,
    });
  }

  console.log(`  Laws: ${laws.length} entries`);
  return laws;
}

/* ------------------------------------------------------------------ */
/* CV                                                                  */
/* ------------------------------------------------------------------ */

const SECTION_ORDER = [
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Speaking",
];

async function syncCV(dbId: string): Promise<CVSection[]> {
  const pages = await queryDatabase(dbId, [
    { property: "Order", direction: "ascending" },
  ]);

  const entries: CVEntry[] = [];

  for (const page of pages) {
    const props = page.properties;
    const blocks = await fetchBlocks(page.id);
    await localizeBlockImages(blocks);

    entries.push({
      id: page.id,
      title: getTitle(props),
      section: getSelect(props, "Section") ?? "Other",
      organization: getText(props, "Organization"),
      start: getDate(props, "Start"),
      end: getDate(props, "End") ?? getDateEnd(props, "Start"),
      location: getText(props, "Location"),
      order: getNumber(props, "Order") ?? 999,
      blocks,
    });
  }

  // Group into sections in a fixed display order, so adding a new
  // Notion select option never reshuffles the About page.
  const grouped = new Map<string, CVEntry[]>();
  for (const entry of entries) {
    if (!grouped.has(entry.section)) grouped.set(entry.section, []);
    grouped.get(entry.section)!.push(entry);
  }

  const sections: CVSection[] = [];
  const seen = new Set<string>();

  for (const name of SECTION_ORDER) {
    const list = grouped.get(name);
    if (list?.length) {
      sections.push({ name, entries: list });
      seen.add(name);
    }
  }
  for (const [name, list] of grouped) {
    if (!seen.has(name)) sections.push({ name, entries: list });
  }

  console.log(`  CV: ${entries.length} entries in ${sections.length} sections`);
  return sections;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const started = Date.now();
  console.log("Syncing content from Notion...");

  const db = databaseIds();

  // Sequential on purpose. Running these in parallel would queue four
  // request streams through one throttle, making progress output
  // interleave confusingly without finishing any faster.
  const blog = await syncBlog(db.blog);
  const portfolio = await syncPortfolio(db.portfolio);
  const laws = await syncLaws(db.laws);
  const cv = await syncCV(db.cv);

  await write("blog.json", blog);
  await write("portfolio.json", portfolio);
  await write("laws.json", laws);
  await write("cv.json", cv);
  await saveCache();

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Done in ${seconds}s`);

  // A build that silently produces an empty site is worse than a failed
  // one. Almost always this means the integration lost access to the
  // parent page, or every row is still Draft.
  if (blog.length + portfolio.length + laws.length === 0) {
    throw new Error(
      "No published content found. Check that the integration is still " +
        "connected to the parent page, and that rows are set to Published."
    );
  }
}

main().catch((err) => {
  console.error("\nSync failed:", err.message ?? err);
  process.exit(1);
});
