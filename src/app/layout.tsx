import type { Metadata } from "next";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import "katex/dist/katex.min.css";
import "./globals.css";

/**
 * Runs before first paint. Dark is the default now, so this only ever
 * ADDS the `light` class — the inverse of the usual setup.
 *
 * Note this ignores the OS preference deliberately: you asked for dark
 * by default, so a light-mode visitor still gets dark until they toggle.
 * To respect the OS instead, use:
 *
 *   var l = s ? s === 'light'
 *             : matchMedia('(prefers-color-scheme: light)').matches;
 */
const THEME_SCRIPT = `
try {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
  }
} catch (e) {}
`;

/**
 * next/font downloads and self-hosts these at build time — no request to
 * Google from your visitors, and no layout shift, since the font files
 * ship from your own origin with the CSS that references them.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE = "https://eddiecarrascoai.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Eddie Carrasco — ML Engineer & Product Manager",
    template: "%s · Eddie Carrasco",
  },
  description:
    "Machine learning engineering and product work: applied ML projects, " +
    "writing on AI systems, and the constraints that shape them.",
  openGraph: {
    type: "website",
    siteName: "Eddie Carrasco",
    url: SITE,
  },
};

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/laws", label: "Laws of AI" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        {/* First tab stop on every page. Invisible until focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>

        <header className="border-b border-rule">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-6 py-5"
          >
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight text-ink"
            >
              Eddie Carrasco
            </Link>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-ink-soft transition-colors hover:text-accent-indigo"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-rule">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-ink-muted">
            <p>© {new Date().getFullYear()} Eddie Carrasco</p>
            <p className="font-mono text-xs">
              Built with Next.js and Notion. Hosted free.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
