/**
 * Prints the real property type of every column in all four databases,
 * flagging any that don't match what the sync script expects.
 *
 * Run: npx tsx scripts/check-schema.ts
 *
 * Standalone by design — it does not import the sync client, so it still
 * works when the sync is broken. That is exactly when you need it.
 */

import "./env";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: "2025-09-03",
});

/** What each database must look like for the sync to behave. */
const EXPECTED: Record<string, Record<string, string>> = {
  NOTION_DB_BLOG: {
    Name: "title",
    Slug: "rich_text",
    Status: "select",
    Published: "date",
    Excerpt: "rich_text",
    Tags: "multi_select",
  },
  NOTION_DB_PORTFOLIO: {
    Name: "title",
    Slug: "rich_text",
    Status: "select",
    Excerpt: "rich_text",
    Tech: "multi_select",
    Category: "select",
    "Repo URL": "url",
    "Demo URL": "url",
    Featured: "checkbox",
    Order: "number",
    Date: "date",
  },
  NOTION_DB_LAWS: {
    Name: "title",
    Slug: "rich_text",
    Status: "select",
    Number: "number",
    Statement: "rich_text",
    Domain: "select",
  },
  NOTION_DB_CV: {
    Name: "title",
    Section: "select",
    Status: "select",
    Organization: "rich_text",
    Start: "date",
    End: "date",
    Location: "rich_text",
    Order: "number",
  },
};

async function checkOne(envName: string, expected: Record<string, string>) {
  const databaseId = process.env[envName];
  if (!databaseId) {
    console.log(`\n${envName}: not set in .env.local`);
    return 1;
  }

  const db: any = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = db.data_sources?.[0]?.id;

  if (!dataSourceId) {
    console.log(`\n${envName}: no data sources — is this a view id?`);
    return 1;
  }

  const ds: any = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });

  const title = db.title?.[0]?.plain_text ?? envName;
  console.log(`\n${title}  (${envName})`);

  const actual: Record<string, string> = {};
  for (const [name, prop] of Object.entries<any>(ds.properties)) {
    actual[name] = prop.type;
  }

  let problems = 0;

  for (const [name, want] of Object.entries(expected)) {
    const got = actual[name];

    if (!got) {
      console.log(`  MISSING  ${name}  (expected ${want})`);
      problems++;
    } else if (got !== want) {
      console.log(`  WRONG    ${name}  is ${got}, should be ${want}`);
      problems++;
    } else {
      console.log(`  ok       ${name}  ${got}`);
    }
  }

  // Extra columns are harmless — the sync ignores them — but worth
  // seeing, since a typo'd rename shows up here as one missing plus
  // one extra rather than as an obvious mistake.
  const extras = Object.keys(actual).filter((n) => !(n in expected));
  if (extras.length) {
    console.log(`  (ignored: ${extras.join(", ")})`);
  }

  return problems;
}

async function main() {
  console.log("Checking Notion database schemas...");

  let total = 0;
  for (const [envName, expected] of Object.entries(EXPECTED)) {
    total += await checkOne(envName, expected);
    await new Promise((r) => setTimeout(r, 400)); // stay under 3 req/sec
  }

  if (total === 0) {
    console.log("\nAll schemas match. Run: npm run sync");
  } else {
    console.log(
      `\n${total} problem${total === 1 ? "" : "s"}. Fix the property types ` +
        `in Notion, then run this again.\n\n` +
        `To change a type: click the column header, then Edit property, ` +
        `then Type. Notion converts existing values in place.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nCheck failed:", err.message ?? err);
  process.exit(1);
});