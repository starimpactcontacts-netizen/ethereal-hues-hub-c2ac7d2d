import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import loopgateHero from "@/assets/loopgate-hero.png";
import loopgateLogo from "@/assets/loopgate-logo-white.png";

const Loopgate = () => {
  return <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-6 lg:px-12">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              Global Events
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14">
        {/* Hero Image */}
        <div className="relative h-[40vh] min-h-[320px] overflow-hidden">
          <img src={loopgateHero} alt="#LOOPGATE" className="w-full h-full object-cover grayscale opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Title */}
        <div className="relative z-10 px-6 lg:px-12 -mt-20">
          <h1 className="text-[32px] md:text-[48px] lg:text-[56px] font-bold tracking-[-0.03em] text-foreground mb-2">
            #LOOPGATE
          </h1>
          <p className="text-[14px] md:text-[16px] text-muted-foreground tracking-wide">
            Open Competitive Editing Index
          </p>
        </div>
      </section>

      {/* Description Section */}
      <section className="px-6 lg:px-12 py-12">
        <div className="max-w-3xl space-y-8">
          {/* Format Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/40 rounded-xl p-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Ranking</span>
                <span className="text-[14px] text-foreground">Top 100 — QOI rating revealed every 24 hours</span>
              </div>
              <div className="bg-secondary/40 rounded-xl p-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Timeline</span>
                <span className="text-[14px] text-foreground">1 week</span>
              </div>
              <div className="bg-secondary/40 rounded-xl p-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Submissions</span>
                <span className="text-[14px] text-foreground">Multiple edit submissions allowed</span>
              </div>
              <div className="bg-secondary/40 rounded-xl p-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Platforms</span>
                <span className="text-[14px] text-foreground">All platforms accepted</span>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-secondary/40 rounded-xl p-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4">
              Rules
            </h3>
            <ul className="space-y-3 text-[13px] text-foreground">
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground/60">•</span>
                <span>Post edit using #loopgate                   </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground/60">•</span>
                <span>
                  Loopgate logo optional (
                  <a href="https://drive.google.com/file/d/1jVtNRItYRoP-XTwEy-LxE43vPq_L8j2m/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                    download logo
                  </a>
                  )
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground/60">•</span>
                <span>Maximum 5 judges active at all times</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground/60">•</span>
                <span>QOI max score: 150/150</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground/60">•</span>
                <span>Open to all styles and platforms (TikTok & Instagram Priority)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="px-6 lg:px-12 pb-16">
        <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
          <div className="flex-1 bg-secondary/60 border border-border rounded-xl px-8 py-5 text-center cursor-default opacity-60">
            <span className="text-[12px] uppercase tracking-[0.2em] font-medium text-foreground">Arena</span>
          </div>
          <a href="https://loopgate.io/rankings" target="_blank" rel="noopener noreferrer" className="flex-1 bg-secondary hover:bg-secondary/80 border border-border rounded-xl px-8 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
            <span className="text-[12px] uppercase tracking-[0.2em] font-medium text-foreground">Leaderboard</span>
          </a>
          <a href="https://submissions.loopgate.io" target="_blank" rel="noopener noreferrer" className="flex-1 bg-secondary hover:bg-secondary/80 border border-border rounded-xl px-8 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
            <span className="text-[12px] uppercase tracking-[0.2em] font-medium text-foreground">Entry</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 lg:px-12 bg-background">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">© 2025 Loopgate</span>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] hover:text-foreground transition-colors">
              Global Events
            </Link>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">Loopgate — Competitive Editing Index</span>
            <a href="https://www.instagram.com/loopgate/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Instagram">
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>;
};
export default Loopgate;