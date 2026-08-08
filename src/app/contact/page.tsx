import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about ML engineering and product work.",
};

/**
 * No form. A static site has no server to POST to, and a third-party
 * form service would be the one dependency on this site that could
 * disappear or start charging. Direct links cost nothing and never break.
 *
 * If you want a form later, a Cloudflare Worker on the free tier keeps
 * it under your control — see the note in SETUP.md.
 */
const LINKS = [
  { label: "Email", value: "you@example.com", href: "mailto:you@example.com" },
  { label: "GitHub", value: "github.com/eddiecarrasco", href: "https://github.com/eddiecarrasco" },
  { label: "LinkedIn", value: "linkedin.com/in/eddiecarrasco", href: "https://linkedin.com/in/eddiecarrasco" },
];

export default function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Contact
      </h1>

      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Open to conversations about applied ML, evaluation, and product
        work. Email is the surest way to reach me.
      </p>

      <dl className="mt-12 space-y-px">
        {LINKS.map((link) => (
          <div
            key={link.label}
            className="grid grid-cols-[7rem_1fr] gap-4 border-t border-rule py-5"
          >
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              {link.label}
            </dt>
            <dd>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-accent-indigo underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-accent-indigo"
              >
                {link.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
