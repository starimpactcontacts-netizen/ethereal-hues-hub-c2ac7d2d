import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { type Event } from "@/components/events/EventCard";
import { FeaturedEventCard } from "@/components/events/FeaturedEventCard";
import { EventRow } from "@/components/events/EventRow";
import { FilterBar } from "@/components/events/FilterBar";
import { ContactForm } from "@/components/events/ContactForm";
import loopgateThumbnail from "@/assets/loopgate-thumbnail.png";
import loopgateHero from "@/assets/loopgate-hero.png";
const events: Event[] = [{
  id: "1",
  title: "#LOOPGATE",
  date: "15 DEC 2025",
  location: "LOOPGATE ARENA",
  category: "Open Competitive Index - Live Leaderboards",
  status: "live",
  imageUrl: loopgateHero,
  externalUrl: "#"
}, {
  id: "2",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "3",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "4",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "5",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "finished",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "6",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "7",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "8",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "finished",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "9",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}, {
  id: "10",
  title: "Open Slot",
  date: "Pending Activation",
  location: "",
  category: "Reserved",
  status: "upcoming",
  imageUrl: loopgateThumbnail,
  externalUrl: "#"
}];

// Featured: Live and upcoming flagship events
const featuredEvents = events.filter(e => e.status === "live" || e.status === "upcoming").slice(0, 5);
const Events = () => {
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeLocation, setActiveLocation] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const locations = useMemo(() => [...new Set(events.map(e => e.location))].sort(), []);
  const categories = useMemo(() => [...new Set(events.map(e => e.category))].sort(), []);
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const statusMatch = activeStatus === "All" || activeStatus === "Upcoming" && event.status === "upcoming" || activeStatus === "Live" && event.status === "live" || activeStatus === "Past" && event.status === "finished";
      const locationMatch = activeLocation === "All" || event.location === activeLocation;
      const categoryMatch = activeCategory === "All" || event.category === activeCategory;
      return statusMatch && locationMatch && categoryMatch;
    });
  }, [activeStatus, activeLocation, activeCategory]);
  return <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-center h-14 px-6 lg:px-12">
          <nav className="flex items-center gap-6">
            <a href="#faq" onClick={e => {
            e.preventDefault();
            document.getElementById('faq')?.scrollIntoView({
              behavior: 'smooth'
            });
          }} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              FAQ
            </a>
            <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors font-serif cursor-pointer">Global Events</Link>
            <Link to="/rankings" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">Rankings</Link>
            <a href="#contact" onClick={e => {
            e.preventDefault();
            document.getElementById('contact')?.scrollIntoView({
              behavior: 'smooth'
            });
          }} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero - Solid dark with layered gradients */}
      <section className="relative h-[36vh] min-h-[280px] flex items-center justify-center pt-14">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(0_0%_20%/0.5),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_50%,hsl(0_0%_15%/0.3),transparent)]" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <span className="font-display text-6xl md:text-7xl lg:text-8xl text-white tracking-tight">LOOPGATE</span>
        </div>
      </section>

      {/* Featured Events Rail */}
      <section className="relative bg-secondary/50">
        {/* Subtle top gradient for depth */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="px-6 lg:px-12 py-10">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Featured
            </h2>
            <span className="text-[10px] text-muted-foreground/60">{featuredEvents.length} events</span>
          </div>
          
          <div className="relative -mx-6 lg:-mx-12">
            <div className="flex gap-5 overflow-x-auto pb-4 px-6 lg:px-12 scrollbar-hide snap-x">
              {featuredEvents.map(event => <FeaturedEventCard key={event.id} event={event} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Event Index */}
      <main className="relative px-6 lg:px-12 py-10">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background -z-10" />
        
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            All Events
          </h2>
          <span className="text-[10px] text-muted-foreground/60">{filteredEvents.length} results</span>
        </div>

        {/* Filter Bar */}
        <FilterBar activeStatus={activeStatus} activeLocation={activeLocation} activeCategory={activeCategory} onStatusChange={setActiveStatus} onLocationChange={setActiveLocation} onCategoryChange={setActiveCategory} locations={locations} categories={categories} />

        {/* Event List */}
        <div className="mt-6 space-y-3">
          {filteredEvents.length > 0 ? filteredEvents.map(event => <EventRow key={event.id} event={event} />) : <div className="py-16 text-center text-muted-foreground text-[13px]">
              No events match the selected filters
            </div>}
        </div>
      </main>

      {/* FAQ Section */}
      <section id="faq" className="relative px-6 lg:px-12 py-16 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-background -z-10" />
        
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-8">
          FAQ
        </h2>
        
        <div className="space-y-4 max-w-3xl">
          <div className="bg-secondary/40 rounded-xl p-5">
            <h3 className="text-[14px] font-medium text-foreground mb-2">Q: What is Loopgate?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">A: Loopgate is a competitive editing index with live leaderboards and campaign-based activations.</p>
          </div>
          
          <div className="bg-secondary/40 rounded-xl p-5">
            <h3 className="text-[14px] font-medium text-foreground mb-2">Q: Is there prize money?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">A: Some activations include prize pools or paid placements. Rewards vary by campaign.</p>
          </div>
          
          <div className="bg-secondary/40 rounded-xl p-5">
            <h3 className="text-[14px] font-medium text-foreground mb-2">Q: Who can participate?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">A: Anyone. Participation depends on the specific activation.</p>
          </div>
          
          <div className="bg-secondary/40 rounded-xl p-5">
            <h3 className="text-[14px] font-medium text-foreground mb-2">Q: How are rankings determined?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">A: Rankings are based on performance signals across live activations and overall index visibility.</p>
          </div>
          
          <div className="bg-secondary/40 rounded-xl p-5">
            <h3 className="text-[14px] font-medium text-foreground mb-2">Q: Is it free to join?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">A: Yes. Loopgate is open. Participation is based on output, not entry fees.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 lg:px-12 py-16 bg-background border-t border-border">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4">
          Contact
        </h2>
        <p className="text-[13px] text-muted-foreground mb-8">For partnerships, questions, or disputes: team@loopgate.io</p>
        
        <ContactForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 lg:px-12 bg-background">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">© 2025 Loopgate</span>
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] hover:text-foreground transition-colors"
            >
              Global Events
            </Link>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">Loopgate — Competitive Editing Index</span>
            <a 
              href="https://www.instagram.com/loopgate/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>;
};
export default Events;