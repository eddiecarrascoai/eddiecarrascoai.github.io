import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import NotionBlocks from "@/components/notion/NotionBlocks";
import { getPost, getPosts, formatDate } from "@/lib/content";

export async function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published ?? undefined,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/blog"
        className="font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-accent-indigo"
      >
        ← Blog
      </Link>

      <header className="mt-10">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-5 flex flex-wrap items-center gap-x-3 font-mono text-xs text-ink-muted">
          <time dateTime={post.published ?? undefined}>
            {formatDate(post.published)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
        </p>

        {post.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-rule px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {post.cover && (
        <Image
          src={post.cover}
          alt=""
          width={1600}
          height={900}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="mt-10 h-auto w-full rounded-lg border border-rule"
        />
      )}

      <div className="mt-12">
        <NotionBlocks blocks={post.blocks} />
      </div>
    </article>
  );
}
