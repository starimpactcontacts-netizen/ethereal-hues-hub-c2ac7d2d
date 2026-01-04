import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp, disableZoom, enablePullToRefresh } from "./lib/native";

// Initialize native features (iOS/Android)
initializeNativeApp();
disableZoom();
enablePullToRefresh();

createRoot(document.getElementById("root")!).render(<App />);
