# Setup after unzipping

Unzip at the repo root. Files land in the right folders; two existing
files get overwritten on purpose (`next.config.ts`, `src/app/globals.css`)
and one placeholder is replaced (`src/app/page.tsx`).

## 1. Install

```bash
npm install @notionhq/client sharp shiki katex
npm install -D tsx
npm uninstall dotenv   # no longer used; @next/env replaces it
```

`@next/env` ships with Next, so it needs no install.

## 2. Edit package.json

Not included in the zip, since yours has your project name and
dependency versions. Add these two scripts:

```json
{
  "scripts": {
    "sync": "tsx scripts/sync-notion.ts",
    "prebuild": "tsx scripts/sync-notion.ts",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

`prebuild` runs automatically before `build`, locally and in CI. `dev`
deliberately does not sync, so `next dev` starts instantly against
whatever is already in `/content`.

## 3. Edit .gitignore

Append:

```
/content
/public/media
.env.local
```

Both generated folders are build artifacts. Committing them turns every
content edit into a repo diff full of hashed filenames.

## 4. Create .env.local

Copy `.env.local.example` to `.env.local` and fill in the token and four
database IDs. Never commit it.

## 5. Add repository secrets

**Settings → Secrets and variables → Actions.** Five secrets, same names
as the env file: `NOTION_TOKEN`, `NOTION_DB_BLOG`, `NOTION_DB_PORTFOLIO`,
`NOTION_DB_LAWS`, `NOTION_DB_CV`.

## 6. Run

```bash
npm run sync    # pull content from Notion
npm run dev     # http://localhost:3000
npm run build   # full static export, catches what dev does not
```

---

# Placeholder content to replace

Real text is needed in four places before this is worth showing anyone:

| File | What to change |
|---|---|
| `src/app/page.tsx` | Hero headline and the paragraph under it |
| `src/app/about/page.tsx` | The intro paragraph under your name |
| `src/app/contact/page.tsx` | The `LINKS` array — email, GitHub, LinkedIn |
| `src/app/layout.tsx` | `SITE` constant and the metadata description |

---

# File map

```
.github/workflows/deploy.yml   Build + deploy, hourly cron, manual trigger
next.config.ts                 Static export config

scripts/
  env.ts                       Loads .env.local (import first, always)
  sync-notion.ts               Entry point: Notion -> /content/*.json
  notion/
    client.ts                  Only file that calls Notion. Rate limiting,
                               retries, data-source resolution
    props.ts                   Flattens Notion property shapes
    media.ts                   Downloads images, converts to WebP, caches

src/
  types/content.ts             Shared types. Components import from here,
                               never from @notionhq/client
  lib/content.ts               Reads /content JSON at build time
  components/
    notion/
      NotionBlocks.tsx         Block tree -> React. Groups list items
      RichText.tsx             Annotations, links, inline code
      CodeBlock.tsx            Shiki highlighting at build time
    ProjectFilter.tsx          Client component: tech filter chips
    PrintButton.tsx            Client component: window.print()
  app/
    layout.tsx                 Fonts, nav, footer, metadata
    globals.css                Design tokens. Change the look here
    page.tsx                   Home
    blog/                      Index + [slug]
    portfolio/                 Index + [slug]
    laws/                      Index + [slug]
    about/                     CV, rendered from the CV database
    contact/                   Static links, no form
```

---

# Things that will bite you later

**Never add a second data source to a Notion database.** `client.ts`
resolves `data_sources[0]` and warns if there are more, but the content
you get back will not be what you expect.

**The `Status` filter is case-sensitive.** A select option named
`published` returns zero rows with no error.

**Slugs are manual on purpose.** Leave one blank and the sync derives it
from the title with a warning — but derived slugs change whenever you
reword a headline, breaking every inbound link.

**`npm install <pkg>` takes whatever is newest.** That is how the SDK
jumped to v5 mid-project. The lockfile is committed, so CI matches local.
