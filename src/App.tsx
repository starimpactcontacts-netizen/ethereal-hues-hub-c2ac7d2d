import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileLayout from "./components/loopgate/MobileLayout";
import HomePage from "./pages/loopgate/HomePage";
import EventDetailPage from "./pages/loopgate/EventDetailPage";
import RankingsPage from "./pages/loopgate/RankingsPage";
import ProfilePage from "./pages/loopgate/ProfilePage";
import LeaguesPage from "./pages/loopgate/LeaguesPage";
import ChampionshipPage from "./pages/loopgate/ChampionshipPage";
import AdminPage from "./pages/loopgate/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/championship" element={<ChampionshipPage />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
