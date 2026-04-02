import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp, disableZoom } from "./lib/native";

// ── Nuclear cache buster ──
// On every load, wipe ALL old caches so no one ever sees stale content
(async () => {
  try {
    // Delete every Cache Storage bucket
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    if (keys.length) console.log("[Loopgate] Purged", keys.length, "old caches");

    // Force any existing SW to skip waiting & claim immediately
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  } catch (e) {
    // SW not supported or blocked — fine
  }
})();

// Don't register SW in iframes / preview hosts (causes stale content in editor)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then(regs =>
    regs.forEach(r => r.unregister())
  );
} else {
  // Register service worker only in production
  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
      window.location.reload();
    },
    onOfflineReady() {
      console.log("[Loopgate] App ready for offline use");
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Check for updates every 15 seconds
        setInterval(() => { registration.update(); }, 15 * 1000);
      }
    },
  });
}

// Initialize native features (iOS/Android)
initializeNativeApp();
disableZoom();

createRoot(document.getElementById("root")!).render(<App />);
