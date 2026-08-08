/**
 * Turns a Notion block tree into React.
 *
 * THE LIST PROBLEM: Notion returns list items as flat siblings. A
 * three-bullet list is three separate `bulleted_list_item` blocks with
 * nothing marking where the list starts or ends. Rendering each one
 * independently gives you three single-item <ul> elements — which looks
 * almost right, spaces wrongly, and is wrong for screen readers, which
 * announce "list, 1 item" three times.
 *
 * So we group consecutive list items of the same type into one list
 * before rendering. Most Notion renderers skip this.
 */

import Image from "next/image";
import CodeBlock from "./CodeBlock";
import RichText from "./RichText";
import type { Block } from "@/types/content";

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

type Group =
  | { kind: "list"; type: "bulleted_list_item" | "numbered_list_item"; items: Block[] }
  | { kind: "block"; block: Block };

function group(blocks: Block[]): Group[] {
  const out: Group[] = [];

  for (const block of blocks) {
    const isList =
      block.type === "bulleted_list_item" || block.type === "numbered_list_item";

    if (!isList) {
      out.push({ kind: "block", block });
      continue;
    }

    const last = out[out.length - 1];
    if (last?.kind === "list" && last.type === block.type) {
      last.items.push(block);
    } else {
      out.push({ kind: "list", type: block.type as any, items: [block] });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Individual blocks                                                   */
/* ------------------------------------------------------------------ */

function renderBlock(block: Block) {
  const { type, id } = block;
  const data = block[type];

  switch (type) {
    case "paragraph":
      // Notion emits empty paragraphs as spacing. Rendering them as <p>
      // creates inconsistent gaps; dropping them lets the type scale own
      // the vertical rhythm.
      if (!data.rich_text?.length) return null;
      return (
        <p key={id} className="my-5 leading-[1.75] text-ink">
          <RichText value={data.rich_text} />
        </p>
      );

    case "heading_1":
      return (
        <h2 key={id} className="mt-14 mb-4 font-display text-3xl font-semibold tracking-tight text-ink">
          <RichText value={data.rich_text} />
        </h2>
      );

    case "heading_2":
      return (
        <h3 key={id} className="mt-12 mb-3 font-display text-2xl font-semibold tracking-tight text-ink">
          <RichText value={data.rich_text} />
        </h3>
      );

    case "heading_3":
      return (
        <h4 key={id} className="mt-9 mb-2 font-display text-xl font-semibold text-ink">
          <RichText value={data.rich_text} />
        </h4>
      );

    case "quote":
      return (
        <blockquote
          key={id}
          className="my-8 border-l-2 border-accent-indigo pl-6 font-display text-xl italic leading-relaxed text-ink-soft"
        >
          <RichText value={data.rich_text} />
          {block.children && <NotionBlocks blocks={block.children} />}
        </blockquote>
      );

    case "callout":
      return (
        <aside
          key={id}
          className="my-8 flex gap-4 rounded-lg border border-rule bg-surface-sunk p-5"
        >
          {data.icon?.emoji && (
            <span className="select-none text-xl leading-7" aria-hidden="true">
              {data.icon.emoji}
            </span>
          )}
          <div className="min-w-0 flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
            <p className="leading-[1.7] text-ink-soft">
              <RichText value={data.rich_text} />
            </p>
            {block.children && <NotionBlocks blocks={block.children} />}
          </div>
        </aside>
      );

    case "code":
      return <CodeBlock key={id} block={block} />;

    case "image": {
      const src =
        data.type === "external" ? data.external.url : data.file?.url;
      if (!src) return null;

      const caption = data.caption?.map((t: any) => t.plain_text).join("") ?? "";

      return (
        <figure key={id} className="my-10">
          <Image
            src={src}
            alt={caption || ""}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 720px"
            className="h-auto w-full rounded-lg border border-rule"
          />
          {caption && (
            <figcaption className="mt-3 text-sm leading-relaxed text-ink-muted">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "divider":
      return <hr key={id} className="my-14 border-0 border-t border-rule" />;

    case "to_do":
      return (
        <div key={id} className="my-2 flex items-baseline gap-3">
          <input
            type="checkbox"
            checked={data.checked}
            readOnly
            aria-label={data.rich_text?.[0]?.plain_text ?? "task"}
            className="translate-y-0.5 accent-accent-indigo"
          />
          <span className={data.checked ? "text-ink-muted line-through" : "text-ink"}>
            <RichText value={data.rich_text} />
          </span>
        </div>
      );

    case "toggle":
      return (
        <details key={id} className="my-4 rounded-lg border border-rule px-5 py-3">
          <summary className="cursor-pointer font-medium text-ink marker:text-ink-muted">
            <RichText value={data.rich_text} />
          </summary>
          <div className="mt-2 border-t border-rule pt-2">
            {block.children && <NotionBlocks blocks={block.children} />}
          </div>
        </details>
      );

    case "bookmark":
      return (
        <a
          key={id}
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-6 block truncate rounded-lg border border-rule px-5 py-4 text-sm text-ink-soft transition-colors hover:border-accent-indigo"
        >
          {data.url}
        </a>
      );

    case "equation":
      // KaTeX renders this. Install `katex` and import its stylesheet in
      // layout.tsx, or these show as raw LaTeX.
      return (
        <div key={id} className="my-8 overflow-x-auto text-center">
          <span
            className="katex-block"
            dangerouslySetInnerHTML={{ __html: renderKatex(data.expression, true) }}
          />
        </div>
      );

    case "table":
      return (
        <div key={id} className="my-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {block.children?.map((row: Block, rowIndex: number) => {
                const cells = row.table_row.cells;
                const isHeader = data.has_column_header && rowIndex === 0;

                return (
                  <tr key={row.id} className="border-b border-rule">
                    {cells.map((cell: any[], i: number) => {
                      const Tag = isHeader ? "th" : "td";
                      return (
                        <Tag
                          key={i}
                          className={
                            isHeader
                              ? "px-3 py-2 text-left font-semibold text-ink"
                              : "px-3 py-2 align-top text-ink-soft"
                          }
                        >
                          <RichText value={cell as any} />
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "column_list":
      return (
        <div key={id} className="my-8 grid gap-8 md:grid-cols-2">
          {block.children?.map((col: Block) => (
            <div key={col.id}>
              {col.children && <NotionBlocks blocks={col.children} />}
            </div>
          ))}
        </div>
      );

    case "table_of_contents":
    case "breadcrumb":
    case "column":
      return null; // handled by parents, or intentionally unsupported

    default:
      // Unknown block types are skipped rather than crashing the build.
      // Notion adds block types over time and a portfolio site should
      // not fail to deploy because you tried a new one in the editor.
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unhandled Notion block type: ${type}`);
      }
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

function renderList(g: Extract<Group, { kind: "list" }>, key: string) {
  const ordered = g.type === "numbered_list_item";
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag
      key={key}
      className={
        ordered
          ? "my-5 list-decimal space-y-2 pl-6 marker:text-ink-muted"
          : "my-5 list-disc space-y-2 pl-6 marker:text-accent-indigo"
      }
    >
      {g.items.map((item) => (
        <li key={item.id} className="pl-1 leading-[1.75] text-ink">
          <RichText value={item[item.type].rich_text} />
          {item.children && (
            <div className="mt-2">
              <NotionBlocks blocks={item.children} />
            </div>
          )}
        </li>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */

export default function NotionBlocks({ blocks }: { blocks: Block[] }) {
  if (!blocks?.length) return null;

  return (
    <>
      {group(blocks).map((g, i) =>
        g.kind === "list" ? renderList(g, `list-${i}`) : renderBlock(g.block)
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Lazy KaTeX so pages without math don't pay for it. */
function renderKatex(expression: string, displayMode: boolean): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const katex = require("katex");
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return expression;
  }
}
