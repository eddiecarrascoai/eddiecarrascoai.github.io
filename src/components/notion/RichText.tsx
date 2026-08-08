/**
 * Renders Notion's rich_text arrays.
 *
 * Notion splits text into segments wherever formatting changes, so a
 * sentence with one bold word arrives as three segments. Each carries an
 * `annotations` object and optionally an href. Rendering is a matter of
 * wrapping each segment in the elements its annotations call for.
 */

import Link from "next/link";

type RichTextItem = {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

/**
 * Notion's named colors mapped to our tokens. Deliberately partial: the
 * palette is a design decision, not Notion's to make. Anything unmapped
 * inherits the surrounding text color, which is nearly always what you
 * want when someone highlights a line in the editor out of habit.
 */
const COLOR_CLASS: Record<string, string> = {
  gray: "text-ink-muted",
  brown: "text-accent-rust",
  blue: "text-accent-indigo",
  red: "text-accent-rust",
  default: "",
};

function segment(item: RichTextItem, index: number) {
  const a = item.annotations;
  let node: React.ReactNode = item.plain_text;

  // Inline code first — the innermost wrapper, and it shouldn't inherit
  // italic or strikethrough styling from an outer span.
  if (a.code) {
    node = (
      <code className="rounded bg-surface-sunk px-1.5 py-0.5 font-mono text-[0.875em] text-accent-indigo">
        {node}
      </code>
    );
  }

  if (a.bold) node = <strong className="font-semibold">{node}</strong>;
  if (a.italic) node = <em>{node}</em>;
  if (a.strikethrough) node = <s className="text-ink-muted">{node}</s>;
  if (a.underline) node = <u className="decoration-from-font">{node}</u>;

  const colorClass = COLOR_CLASS[a.color] ?? "";
  if (colorClass) node = <span className={colorClass}>{node}</span>;

  if (item.href) {
    const external = item.href.startsWith("http");
    return external ? (
      <a
        key={index}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-accent-indigo"
      >
        {node}
      </a>
    ) : (
      <Link
        key={index}
        href={item.href}
        className="underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-accent-indigo"
      >
        {node}
      </Link>
    );
  }

  return <span key={index}>{node}</span>;
}

export default function RichText({ value }: { value?: RichTextItem[] }) {
  if (!value?.length) return null;
  return <>{value.map(segment)}</>;
}

/** Plain string version, for <title> tags and meta descriptions. */
export function richTextToPlain(value?: RichTextItem[]): string {
  return value?.map((t) => t.plain_text).join("") ?? "";
}
