import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp, disableZoom } from "./lib/native";

// Register service worker with aggressive auto-update
// Checks for updates every 60 seconds and reloads immediately when found
const updateSW = registerSW({
  onNeedRefresh() {
    // Immediately activate the new SW — no prompt, just update
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[Loopgate] App ready for offline use");
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
});

// Initialize native features (iOS/Android)
initializeNativeApp();
disableZoom();

createRoot(document.getElementById("root")!).render(<App />);
