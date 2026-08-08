import type { Metadata } from "next";
import Link from "next/link";

import { getPosts, formatDate } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on machine learning systems, evaluation, and product.",
};

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Blog
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Notes on building and evaluating ML systems, and on the product
          decisions that surround them.
        </p>
      </header>

      <div className="mt-14 space-y-px">
        {posts.map((post) => (
          <article key={post.id} className="border-t border-rule py-8">
            <Link href={`/blog/${post.slug}`} className="group block">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-indigo">
                {post.title}
              </h2>

              <p className="mt-3 leading-relaxed text-ink-soft">
                {post.excerpt}
              </p>

              <p className="mt-4 flex flex-wrap items-center gap-x-3 font-mono text-xs text-ink-muted">
                <time dateTime={post.published ?? undefined}>
                  {formatDate(post.published)}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime} min read</span>
                {post.tags.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase tracking-wider">
                      {post.tags.join(", ")}
                    </span>
                  </>
                )}
              </p>
            </Link>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="mt-14 border-t border-rule pt-8 text-ink-muted">
          No posts published yet.
        </p>
      )}
    </div>
  );
}
