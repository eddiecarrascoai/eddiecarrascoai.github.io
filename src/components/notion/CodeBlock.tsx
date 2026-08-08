/**
 * Syntax highlighting with Shiki, at build time.
 *
 * This is an async Server Component. Under `output: "export"` it runs
 * during `next build` and its output is baked into static HTML — so the
 * browser downloads highlighted markup and zero highlighting JavaScript.
 * Prism or highlight.js would ship a runtime and a stylesheet to every
 * visitor to reach the same pixels.
 *
 * Shiki uses TextMate grammars, the same engine as VS Code, so Python
 * and TypeScript highlight exactly as they do in your editor.
 */

import { codeToHtml } from "shiki";
import RichText from "./RichText";

/**
 * Notion's language names don't all match Shiki's identifiers. Unmapped
 * languages pass through as-is; genuinely unknown ones fall back to
 * plaintext rather than throwing, because a build should not fail over a
 * mislabeled code fence.
 */
const LANG_MAP: Record<string, string> = {
  "plain text": "text",
  "c++": "cpp",
  "c#": "csharp",
  "objective-c": "objc",
  shell: "bash",
  "f#": "fsharp",
  docker: "dockerfile",
  "vb.net": "vb",
};

const SUPPORTED = new Set([
  "python", "typescript", "javascript", "tsx", "jsx", "bash", "json",
  "yaml", "sql", "rust", "go", "java", "cpp", "csharp", "html", "css",
  "markdown", "text", "toml", "graphql", "r", "julia", "dockerfile",
]);

export default async function CodeBlock({ block }: { block: any }) {
  const code = block.code.rich_text.map((t: any) => t.plain_text).join("");
  const raw = (block.code.language ?? "text").toLowerCase();
  const mapped = LANG_MAP[raw] ?? raw;
  const lang = SUPPORTED.has(mapped) ? mapped : "text";

  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false, // emits CSS vars for both, switched by media query
  });

  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-lg border border-rule bg-surface-sunk">
        {lang !== "text" && (
          <div className="border-b border-rule px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-muted">
            {lang}
          </div>
        )}
        <div
          className="overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {block.code.caption?.length > 0 && (
        <figcaption className="mt-2 text-sm text-ink-muted">
          <RichText value={block.code.caption} />
        </figcaption>
      )}
    </figure>
  );
}
