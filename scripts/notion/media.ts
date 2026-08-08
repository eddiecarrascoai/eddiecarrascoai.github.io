/**
 * Downloads Notion-hosted images to /public/media.
 *
 * THE PROBLEM: images stored in Notion are served as signed S3 URLs that
 * expire in roughly an hour. Any site that hotlinks them looks fine on
 * launch day and shows broken images by the next morning. Every asset
 * must be pulled down at build time.
 *
 * THE CACHE KEY PROBLEM: the obvious cache key is the URL, but the
 * signature changes on every API call, so a URL-keyed cache never hits
 * and you re-download everything hourly. We key on the owning block or
 * page id plus its last_edited_time instead — that only changes when
 * you actually edit the image.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const CACHE_FILE = path.join(process.cwd(), "content", ".media-cache.json");
const MAX_WIDTH = 1600;

type Cache = Record<string, string>; // cacheKey -> "/media/abc123.webp"

let cache: Cache = {};
let cacheLoaded = false;
let downloads = 0;
let hits = 0;

async function loadCache() {
  if (cacheLoaded) return;
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    cache = {};
  }
  cacheLoaded = true;
}

export async function saveCache() {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`  Media: ${downloads} downloaded, ${hits} cached`);
}

/**
 * Returns a local path like "/media/a1b2c3d4.webp", or the original URL
 * unchanged if it is external (already stable) or the download fails.
 *
 * @param url          the signed Notion URL
 * @param ownerId      block or page id that owns the image
 * @param lastEdited   that owner's last_edited_time
 */
export async function localizeImage(
  url: string | null,
  ownerId: string,
  lastEdited: string
): Promise<string | null> {
  if (!url) return null;

  // External URLs (Unsplash, your own CDN) don't expire — leave them.
  if (!url.includes("amazonaws.com") && !url.includes("notion-static.com")) {
    return url;
  }

  await loadCache();

  const cacheKey = createHash("sha256")
    .update(`${ownerId}:${lastEdited}`)
    .digest("hex")
    .slice(0, 16);

  const cached = cache[cacheKey];
  if (cached && existsSync(path.join(process.cwd(), "public", cached.slice(1)))) {
    hits++;
    return cached;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const input = Buffer.from(await res.arrayBuffer());

    // Convert to WebP and cap the width. Notion happily stores 4000px
    // screenshots; shipping those to a phone is the fastest way to make
    // a static site feel slow.
    const output = await sharp(input)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const filename = `${cacheKey}.webp`;
    await mkdir(MEDIA_DIR, { recursive: true });
    await writeFile(path.join(MEDIA_DIR, filename), output);

    const publicPath = `/media/${filename}`;
    cache[cacheKey] = publicPath;
    downloads++;
    return publicPath;
  } catch (err) {
    console.warn(`  ! Image download failed for ${ownerId}: ${err}`);
    // Returning the signed URL keeps the build green; the image will
    // 403 within the hour, which is visible and easy to trace.
    return url;
  }
}

/** Walks a block tree and replaces every image URL with a local path. */
export async function localizeBlockImages(blocks: any[]): Promise<void> {
  for (const block of blocks) {
    if (block.type === "image") {
      const img = block.image;
      const src = img.type === "file" ? img.file.url : img.external?.url;
      const local = await localizeImage(src, block.id, block.last_edited_time);

      if (local) {
        block.image = {
          type: "external",
          external: { url: local },
          caption: img.caption ?? [],
        };
      }
    }

    if (block.type === "file" || block.type === "pdf" || block.type === "video") {
      // Same expiry applies. Left as-is deliberately: none of your four
      // content types use them yet. Extend here when that changes.
    }

    if (block.children) await localizeBlockImages(block.children);
  }
}
