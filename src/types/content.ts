/**
 * The shape of everything in /content. These are the types your React
 * components consume — no component should ever import from
 * @notionhq/client. That boundary is what lets you swap Notion for
 * Markdown files later without touching the UI.
 */

/** Notion's block tree, passed through as-is and rendered by NotionBlocks. */
export type Block = Record<string, any> & {
  id: string;
  type: string;
  children?: Block[];
};

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: string | null;
  excerpt: string;
  tags: string[];
  cover: string | null;
  readingTime: number;
  blocks: Block[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tech: string[];
  category: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  order: number;
  date: string | null;
  cover: string | null;
  blocks: Block[];
}

export interface Law {
  id: string;
  title: string;
  slug: string;
  number: number;
  statement: string;
  domain: string | null;
  cover: string | null;
  blocks: Block[];
}

export interface CVEntry {
  id: string;
  title: string;
  section: string;
  organization: string;
  start: string | null;
  end: string | null;
  location: string;
  order: number;
  blocks: Block[];
}

export interface CVSection {
  name: string;
  entries: CVEntry[];
}
