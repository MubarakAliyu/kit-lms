"use client";

import { useEffect, useState } from "react";

// Module-level singleton — survives provider re-mounts so the loader only
// ever appears once per browser session. Without this, navigating between
// pages that re-mount this provider (e.g. via fast-refresh in dev) would
// flash the boot screen each time.
let mswStarted = false;

// Single source of truth for browser MSW boot. Gates the entire app until
// `worker.start()` resolves so no client API call escapes to the network
// before the handlers are registered. In production this is a pass-through.
export function MSWProvider({ children }) {
  const [ready, setReady] = useState(
    mswStarted || process.env.NODE_ENV !== "development"
  );

  useEffect(() => {
    if (mswStarted || process.env.NODE_ENV !== "development") {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function startWorker() {
      try {
        const { worker } = await import("@/_lib/mocks/browser");
        await worker.start({
          onUnhandledRequest: "bypass",
          serviceWorker: { url: "/mockServiceWorker.js" },
        });
        mswStarted = true;
      } catch (err) {
        // Surface in console but unblock the app — better to render with
        // failed mocks than to leave the user staring at a loader.
        console.warn("MSW failed to start:", err);
        mswStarted = true;
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    startWorker();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0B1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#10B981",
            fontFamily: "monospace",
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          Starting dev environment...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
