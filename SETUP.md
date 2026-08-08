# Notion sync layer — setup

## 1. Install dependencies

```bash
npm install @notionhq/client dotenv sharp
npm install -D tsx
```

`sharp` does the WebP conversion and resizing. `tsx` runs TypeScript
scripts directly, so the sync script shares types with the app without a
separate build step.

## 2. Copy the files in

```
scripts/
  sync-notion.ts
  notion/
    client.ts
    props.ts
    media.ts
src/types/
  content.ts
.env.local.example
```

## 3. Wire up npm scripts

In `package.json`:

```json
{
  "scripts": {
    "sync": "tsx scripts/sync-notion.ts",
    "prebuild": "tsx scripts/sync-notion.ts",
    "dev": "next dev",
    "build": "next build"
  }
}
```

`prebuild` runs automatically before `build` — locally and in CI. `dev`
deliberately does not sync, so `next dev` starts instantly against
whatever is in `/content`. Run `npm run sync` when you want fresh
content while developing.

## 4. Get your database IDs

Open each database as a full page. The URL looks like:

```
https://www.notion.so/workspace/1f2a3b4c5d6e7f8091a2b3c4d5e6f708?v=abc123
                               ^-------------- this part --------------^
```

Copy that into `.env.local`. Careful: the `?v=` value is a *view* id,
not the database id — grabbing the wrong one gives a confusing
`object_not_found`.

## 5. Ignore generated output

Add to `.gitignore`:

```
/content
/public/media
```

Both are build artifacts. Committing them means every content edit shows
up as a repo diff full of base64-ish filenames.

## 6. Add the secrets to GitHub

**Settings → Secrets and variables → Actions.** You already have
`NOTION_TOKEN`; add the four database IDs the same way. They aren't
really secret, but keeping them together beats splitting config across
two places.

## 7. Update the workflow

Replace the build step in `.github/workflows/deploy.yml`:

```yaml
      - name: Restore media cache
        uses: actions/cache@v4
        with:
          path: |
            public/media
            content/.media-cache.json
          key: notion-media-${{ github.run_id }}
          restore-keys: notion-media-

      - run: npm run build
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DB_BLOG: ${{ secrets.NOTION_DB_BLOG }}
          NOTION_DB_PORTFOLIO: ${{ secrets.NOTION_DB_PORTFOLIO }}
          NOTION_DB_LAWS: ${{ secrets.NOTION_DB_LAWS }}
          NOTION_DB_CV: ${{ secrets.NOTION_DB_CV }}
```

The cache matters more than it looks. CI starts from a clean checkout
every run, so without it your hourly build re-downloads and re-encodes
every image — slow, and needless load on Notion. The rolling
`restore-keys` pattern reuses the most recent cache and saves a fresh one
each run.

## 8. Run it

```bash
npm run sync
```

Expected output:

```
Syncing content from Notion...
  Blog: 2 posts
  Portfolio: 3 projects
  Laws: 4 entries
  CV: 10 entries in 4 sections
  Media: 6 downloaded, 0 cached
Done in 11.3s
```

Run it twice — the second run should report most images as cached and
finish noticeably faster. If it doesn't, the cache key isn't matching
and it's worth fixing before it costs you every build.

## Troubleshooting

**`object_not_found`** — either the id is a view id (see step 4), or the
integration lost access. Open the database, **••• → Connections**, and
confirm your integration is listed.

**Zero rows returned** — the `Status` filter is exact-match on the string
`Published`. A select option named `published` or `Publish` returns
nothing. Notion's select options are case-sensitive.

**`Could not find property Status`** — a database still has that column
as text rather than select. Convert it in the UI.

**Images 403 on the live site** — a download failed and the script fell
back to the signed URL. Check the build log for `Image download failed`.ß