/**
 * The ONLY file that talks to Notion directly.
 *
 * Targets Notion API 2025-09-03 and @notionhq/client v5.
 *
 * In this model a database is a container holding one or more "data
 * sources" — what used to be called a database. Queries run against a
 * data source, so every database id has to be resolved to a data source
 * id first. Your four databases each hold exactly one.
 */

import { Client } from "@notionhq/client";

const NOTION_VERSION = "2025-09-03";

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

let _client: Client | null = null;

/**
 * Constructed on first use, not at import time.
 *
 * ES modules evaluate every import before the importing file's body
 * runs, so anything checked at module scope here would run before the
 * entry point had a chance to load .env.local.
 */
function client(): Client {
  if (_client) return _client;

  const auth = process.env.NOTION_TOKEN;
  if (!auth) {
    throw new Error(
      "NOTION_TOKEN is not set. Add it to .env.local for local builds, " +
        "or to repository secrets for CI."
    );
  }

  _client = new Client({ auth, notionVersion: NOTION_VERSION });
  return _client;
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

/**
 * Notion allows ~3 requests/second per integration. We serialize every
 * request through a single promise chain with a fixed gap. Slower than
 * a parallel pool, but a portfolio site syncs in seconds either way,
 * and this never trips a 429.
 */
const MIN_GAP_MS = 350;

let chain: Promise<unknown> = Promise.resolve();
let lastCall = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastCall));
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    return fn();
  });
  // Keep the chain alive even if one call rejects.
  chain = result.catch(() => undefined);
  return result as Promise<T>;
}

/**
 * Retries on 429 and 5xx with exponential backoff. Notion sends a
 * Retry-After header on rate limit responses; we honor it when present.
 */
async function withRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await throttle(fn);
  } catch (err: unknown) {
    const e = err as { status?: number; headers?: Record<string, string> };
    const retryable = e.status === 429 || (e.status ?? 0) >= 500;

    if (!retryable || attempt >= 4) throw err;

    const retryAfter = Number(e.headers?.["retry-after"]);
    const backoff = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 2 ** attempt * 1000;

    console.warn(
      `  Notion returned ${e.status}, retrying in ${backoff}ms ` +
        `(attempt ${attempt + 1}/4)`
    );
    await sleep(backoff);
    return withRetry(fn, attempt + 1);
  }
}

/* ------------------------------------------------------------------ */
/* Data source resolution                                              */
/* ------------------------------------------------------------------ */

const dataSourceCache = new Map<string, string>();

/**
 * Turns a database id into the data source id that queries need.
 *
 * Costs one extra request per database, cached for the process — four
 * requests per sync, which is nothing. Keeping database ids in .env.local
 * is the right trade: they're what you can actually copy from a Notion
 * URL, whereas data source ids are buried in database settings.
 */
async function resolveDataSourceId(databaseId: string): Promise<string> {
  const cached = dataSourceCache.get(databaseId);
  if (cached) return cached;

  const db: any = await withRetry(() =>
    client().databases.retrieve({ database_id: databaseId })
  );

  const sources = db.data_sources ?? [];

  if (sources.length === 0) {
    throw new Error(
      `Database ${databaseId} has no data sources. This usually means the ` +
        `id belongs to something else — check you copied the part before ` +
        `"?v=" in the URL, not the view id.`
    );
  }

  if (sources.length > 1) {
    console.warn(
      `  ! Database "${db.title?.[0]?.plain_text ?? databaseId}" has ` +
        `${sources.length} data sources; using "${sources[0].name}". ` +
        `Split it into separate databases if that's not what you want.`
    );
  }

  dataSourceCache.set(databaseId, sources[0].id);
  return sources[0].id;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/**
 * Fetches every Published row from a database, handling pagination.
 * Takes a database id and resolves the data source internally, so
 * callers never deal with the distinction.
 */
export async function queryDatabase(
  databaseId: string,
  sorts?: Array<Record<string, unknown>>
): Promise<any[]> {
  const dataSourceId = await resolveDataSourceId(databaseId);

  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const res: any = await withRetry(() =>
      client().dataSources.query({
        data_source_id: dataSourceId,
        filter: { property: "Status", select: { equals: "Published" } },
        sorts: sorts as any,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return pages;
}

/**
 * Fetches a block's children recursively.
 *
 * Unchanged in 2025-09-03 — blocks and pages were not part of the data
 * source migration.
 *
 * Notion returns nested content (list items, toggles, callouts, columns)
 * as a tree you have to walk yourself — `has_children` tells you when to
 * recurse. Each level costs a request, so deeply nested pages are the
 * main driver of sync time.
 */
export async function fetchBlocks(blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const res: any = await withRetry(() =>
      client().blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  for (const block of blocks) {
    if (block.has_children) {
      block.children = await fetchBlocks(block.id);
    }
  }

  return blocks;
}

export async function fetchPage(pageId: string): Promise<any> {
  return withRetry(() => client().pages.retrieve({ page_id: pageId }));
}
