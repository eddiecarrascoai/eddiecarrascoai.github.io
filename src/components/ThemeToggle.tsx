"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      // Safari private browsing throws. Works for the session, won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (light ? "Switch to dark theme" : "Switch to light theme") : "Toggle theme"}
      className="text-ink-soft transition-colors hover:text-accent-indigo"
    >
      {mounted ? (light ? "Dark" : "Light") : ""}
    </button>
  );
}
