import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, X, Check, Lock, Unlock, Download } from "lucide-react";
import { mockEvents, generateEditors } from "@/data/loopgateData";

export default function AdminPage() {
  const [events, setEvents] = useState(mockEvents);
  const editors = generateEditors(20);

  const handleToggleEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: e.status === "live" ? "closed" : e.status === "pending" ? "live" : "pending",
            }
          : e
      )
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold">OPERATOR PANEL</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Admin Access
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Event Management */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Event Control
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Status: <span className="uppercase">{event.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleEvent(event.id)}
                    className={`p-2 rounded-lg ${
                      event.status === "live"
                        ? "bg-green-600"
                        : event.status === "pending"
                        ? "bg-gold"
                        : "bg-muted"
                    }`}
                  >
                    {event.status === "live" ? (
                      <Unlock size={18} />
                    ) : event.status === "closed" ? (
                      <Lock size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create Activation */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Create Activation
          </h2>
          <button className="w-full bg-card border border-dashed border-border rounded-lg p-6 text-center card-hover">
            <Plus size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">New Event</p>
          </button>
        </section>

        {/* Rankings Lock */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Rankings Control
          </h2>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Lock Rankings</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Freeze current standings
                </p>
              </div>
              <button className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">
                <Lock size={14} className="inline mr-1" />
                Lock
              </button>
            </div>
          </div>
        </section>

        {/* Qualification Approvals */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Pending Qualifications
          </h2>
          <div className="space-y-2">
            {editors.slice(0, 5).map((editor) => (
              <div
                key={editor.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{editor.alias}</p>
                  <p className="text-xs text-muted-foreground">
                    #{editor.rank} • {editor.indexScore.toFixed(1)} Index
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-green-600 rounded-lg">
                    <Check size={16} />
                  </button>
                  <button className="p-2 bg-destructive rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Export */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Export
          </h2>
          <button className="w-full bg-gold text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
            <Download size={18} />
            Export Winners
          </button>
        </section>
      </div>
    </div>
  );
}
