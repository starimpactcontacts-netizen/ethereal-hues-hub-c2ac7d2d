import { BrowserRouter, Routes, Route } from "react-router-dom";
import Events from "./pages/Events";
import Index from "./pages/Index";
import Loopgate from "./pages/Loopgate";
import Rankings from "./pages/Rankings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Events />} />
        <Route path="/demo" element={<Index />} />
        <Route path="/loopgate" element={<Loopgate />} />
        <Route path="/arena" element={<Loopgate />} />
        <Route path="/leaderboard" element={<Loopgate />} />
        <Route path="/entry" element={<Loopgate />} />
        <Route path="/rankings" element={<Rankings />} />
      </Routes>
    </BrowserRouter>
  );
}