import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Static export: `next build` writes plain HTML/CSS/JS to /out, which
   * any free host serves. No Node runtime, so no ISR, middleware, route
   * handlers, or server actions.
   */
  output: "export",

  /**
   * Image Optimization needs a running server, which static export does
   * not have. Resizing and WebP conversion happen instead in
   * scripts/notion/media.ts at sync time.
   */
  images: { unoptimized: true },

  /**
   * Makes GitHub Pages resolve /blog/my-post/ to the right index.html.
   * Without it, navigating directly to a nested route 404s.
   */
  trailingSlash: true,
};

export default nextConfig;
