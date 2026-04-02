import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp, disableZoom } from "./lib/native";

// ── CACHE VERSION — bump this string to force a full wipe on all devices ──
const CACHE_VERSION = "v2026-04-02a";

const didWipe = localStorage.getItem("lg_cache_version");
if (didWipe !== CACHE_VERSION) {
  // One-time nuclear wipe: kill every SW + every cache bucket
  (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (_) {}
    localStorage.setItem("lg_cache_version", CACHE_VERSION);
    window.location.reload();
  })();
} else {
  // Normal boot — no more service worker, just a plain web app
  initializeNativeApp();
  disableZoom();
  createRoot(document.getElementById("root")!).render(<App />);
}
