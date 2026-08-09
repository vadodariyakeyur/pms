import { useEffect, useState } from "react";

const POLL_MS = 5 * 60 * 1000;

// Vite rewrites index.html's module script to a fingerprinted asset at build
// time, so this src is the build marker. In dev it stays "/src/main.tsx".
const scriptSrc = (doc: Document) =>
  doc.querySelector('script[type="module"]')?.getAttribute("src") ?? "";

const bootSrc = scriptSrc(document);

// Dev serves an unhashed src, so there is nothing to compare — skip polling.
const enabled = /-[A-Za-z0-9_-]{8,}\.js$/.test(bootSrc);

/** True once a newer build is live on the server. Never resets. */
export function useNewVersion() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!enabled || stale) return;

    let cancelled = false;

    const check = async () => {
      // A failed fetch offline is not a new version.
      if (!navigator.onLine) return;
      try {
        const res = await fetch(window.location.pathname, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const html = await res.text();
        const src = scriptSrc(new DOMParser().parseFromString(html, "text/html"));
        if (!cancelled && src && src !== bootSrc) setStale(true);
      } catch {
        // Transient network blip — try again next tick.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const id = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [stale]);

  return stale;
}
