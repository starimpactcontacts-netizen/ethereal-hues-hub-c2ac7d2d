import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp, disableZoom } from "./lib/native";

// Initialize native features (iOS/Android)
initializeNativeApp();
disableZoom();

createRoot(document.getElementById("root")!).render(<App />);
