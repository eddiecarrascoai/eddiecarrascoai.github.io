/**
 * Notion wraps every property value in several layers of structure.
 * A title is `props.Name.title[0].plain_text`; a multi-select is
 * `props.Tech.multi_select[].name`. These helpers flatten that once,
 * here, so no component ever touches Notion's shape.
 *
 * Every helper returns a safe default rather than throwing. A missing
 * property means an empty string, not a failed build — you should not
 * lose the whole site because one draft lacks an excerpt.
 */

type Props = Record<string, any>;

export function getTitle(props: Props, key = "Name"): string {
  return props[key]?.title?.map((t: any) => t.plain_text).join("") ?? "";
}

export function getText(props: Props, key: string): string {
  return props[key]?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
}

export function getSelect(props: Props, key: string): string | null {
  return props[key]?.select?.name ?? null;
}

export function getMultiSelect(props: Props, key: string): string[] {
  return props[key]?.multi_select?.map((s: any) => s.name) ?? [];
}

/** Returns an ISO date string (YYYY-MM-DD) or null. */
export function getDate(props: Props, key: string): string | null {
  return props[key]?.date?.start ?? null;
}

/** For a Notion date range property; null when the range has no end. */
export function getDateEnd(props: Props, key: string): string | null {
  return props[key]?.date?.end ?? null;
}

export function getUrl(props: Props, key: string): string | null {
  const url = props[key]?.url;
  return url && url.trim() !== "" ? url : null;
}

export function getCheckbox(props: Props, key: string): boolean {
  return props[key]?.checkbox ?? false;
}

export function getNumber(props: Props, key: string): number | null {
  return props[key]?.number ?? null;
}

/**
 * Slug fallback. If you forget to fill in Slug, we derive one from the
 * title rather than emitting a page at `/blog/undefined`. The build
 * warns when this happens — derived slugs change whenever you reword a
 * headline, which silently breaks every inbound link to that post.
 */
export function getSlug(props: Props, title: string, context: string): string {
  const slug = getText(props, "Slug").trim();
  if (slug) return slug;

  const derived = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  console.warn(`  ! ${context}: no Slug set, derived "${derived}" from title`);
  return derived || "untitled";
}

/**
 * Cover image URL, checking the page cover first and then a Files
 * property. Both are signed S3 links that expire in about an hour,
 * so these get downloaded, never stored.
 */
export function getCoverUrl(page: any, filesKey = "Cover"): string | null {
  const cover = page.cover;
  if (cover?.type === "file") return cover.file.url;
  if (cover?.type === "external") return cover.external.url;

  const files = page.properties?.[filesKey]?.files;
  const first = files?.[0];
  if (!first) return null;
  return first.type === "file" ? first.file.url : first.external?.url ?? null;
}

/** Rough reading time from the block tree. ~220 words per minute. */
export function estimateReadingTime(blocks: any[]): number {
  let words = 0;

  const walk = (list: any[]) => {
    for (const block of list) {
      const rich = block[block.type]?.rich_text;
      if (Array.isArray(rich)) {
        words += rich
          .map((t: any) => t.plain_text)
          .join(" ")
          .split(/\s+/)
          .filter(Boolean).length;
      }
      if (block.children) walk(block.children);
    }
  };

  walk(blocks);
  return Math.max(1, Math.round(words / 220));
}
