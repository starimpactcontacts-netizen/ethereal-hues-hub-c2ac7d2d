import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

// Placeholder data
const top100Editors = Array.from({
  length: 20
}, (_, i) => ({
  rank: i + 1,
  name: `Editor_${String(i + 1).padStart(3, '0')}`,
  score: (95 - i * 0.8).toFixed(1),
  edits: Math.floor(150 - i * 5),
  movement: i % 3 === 0 ? "up" : i % 3 === 1 ? "down" : "stable"
}));
const risingStars = [{
  rank: 1,
  name: "Nova_Edit",
  score: "89.2",
  growth: "+340%"
}, {
  rank: 2,
  name: "CutMaster_X",
  score: "87.5",
  growth: "+285%"
}, {
  rank: 3,
  name: "FrameHunter",
  score: "86.1",
  growth: "+220%"
}, {
  rank: 4,
  name: "SyncWave",
  score: "84.8",
  growth: "+195%"
}, {
  rank: 5,
  name: "BeatDrop_Pro",
  score: "83.4",
  growth: "+180%"
}];
const seasonalChampions = [{
  season: "Winter 2025",
  name: "VelocityKing",
  score: "97.8"
}, {
  season: "Fall 2024",
  name: "EditLegend_01",
  score: "96.5"
}, {
  season: "Summer 2024",
  name: "LoopMaster",
  score: "95.2"
}, {
  season: "Spring 2024",
  name: "CutPro_Elite",
  score: "94.9"
}];
const groupRankings = [{
  rank: 1,
  name: "Velocity Collective",
  members: 12,
  avgScore: "91.4"
}, {
  rank: 2,
  name: "Frame Perfect",
  members: 8,
  avgScore: "89.7"
}, {
  rank: 3,
  name: "Edit Dynasty",
  members: 15,
  avgScore: "88.2"
}, {
  rank: 4,
  name: "Loop Society",
  members: 10,
  avgScore: "87.5"
}, {
  rank: 5,
  name: "Cut Kings",
  members: 6,
  avgScore: "86.8"
}];
const Rankings = () => {
  return <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-center h-14 px-6 lg:px-12">
          <nav className="flex items-center gap-6">
            <a href="/#faq" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              FAQ
            </a>
            <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              Global Events
            </Link>
            <Link to="/rankings" className="text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors font-serif cursor-pointer">
              Rankings
            </Link>
            <a href="/#contact" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[28vh] min-h-[220px] flex items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(0_0%_20%/0.5),transparent)]" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <h1 className="text-[28px] md:text-[36px] font-medium tracking-[-0.02em] text-foreground font-serif">
            Global Rankings
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground max-w-md font-serif">
            Live performance index across all competitive activations
          </p>
        </div>
      </section>

      {/* Top 100 Editors */}
      <section className="relative bg-secondary/50 px-6 lg:px-12 py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">TOP 100 EDITORS - #LOOPGATE EVENT</h2>
          <span className="text-muted-foreground/60 font-serif text-xs">QOI Rankings ( preview Rankings -  will activate automatically once submissions begin. )</span>
        </div>

        <div className="space-y-2">
          {top100Editors.map(editor => <div key={editor.rank} className="group flex items-center gap-5 p-4 rounded-xl bg-card hover:bg-secondary transition-colors duration-200">
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-[18px] font-medium text-foreground">
                  {editor.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-foreground tracking-[-0.01em]">
                  {editor.name}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {editor.edits} edits indexed
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[15px] font-medium text-foreground">
                  {editor.score}
                </span>
                <span className="text-[11px] text-muted-foreground ml-1">QOI</span>
              </div>
            </div>)}
        </div>

        <div className="mt-6 text-center">
          <span className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.15em]">
            Showing 20 of 100 • Full rankings coming soon
          </span>
        </div>
      </section>

      {/* Rising Stars */}
      <section className="relative px-6 lg:px-12 py-10 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background -z-10" />
        
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Rising Stars
          </h2>
          <span className="text-[10px] text-muted-foreground/60">Fastest Growth</span>
        </div>

        <div className="space-y-2">
          {risingStars.map(star => <div key={star.rank} className="group flex items-center gap-5 p-4 rounded-xl bg-card hover:bg-secondary transition-colors duration-200">
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-[18px] font-medium text-foreground">
                  {star.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-foreground tracking-[-0.01em]">
                  {star.name}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {star.score} QOI
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[13px] font-medium text-emerald-500">
                  {star.growth}
                </span>
              </div>
            </div>)}
        </div>
      </section>

      {/* Seasonal Champions */}
      

      {/* Group Rankings */}
      <section className="relative px-6 lg:px-12 py-10 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-background -z-10" />
        
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Group Rankings
          </h2>
          <span className="text-[10px] text-muted-foreground/60">Collective Performance</span>
        </div>

        <div className="space-y-2">
          {groupRankings.map(group => <div key={group.rank} className="group flex items-center gap-5 p-4 rounded-xl bg-card hover:bg-secondary transition-colors duration-200">
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-[18px] font-medium text-foreground">
                  {group.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-foreground tracking-[-0.01em]">
                  {group.name}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {group.members} members
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[15px] font-medium text-foreground">
                  {group.avgScore}
                </span>
                <span className="text-[11px] text-muted-foreground ml-1">Avg QOI</span>
              </div>
            </div>)}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 lg:px-12 bg-background">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
            © 2025 Loopgate
          </span>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] hover:text-foreground transition-colors">
              Global Events
            </Link>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
              Loopgate — Competitive Editing Index
            </span>
            <a href="https://www.instagram.com/loopgate/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Instagram">
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>;
};
export default Rankings;