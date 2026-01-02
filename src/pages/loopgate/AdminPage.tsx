import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, X, Check, Lock, Unlock, Download, Eye, Save, ChevronDown, ChevronUp } from "lucide-react";
import { mockEvents, generateEditors } from "@/data/loopgateData";

interface Submission {
  id: string;
  alias: string;
  platform: "tiktok" | "instagram" | "youtube";
  platformLink: string;
  eventId: string;
  status: "pending" | "reviewed" | "scored";
  scores?: {
    quality: number;
    originality: number;
    impact: number;
  };
  judge?: string;
}

// Mock submissions
const mockSubmissions: Submission[] = [
  { id: "1", alias: "VELOCITY_X", platform: "tiktok", platformLink: "https://tiktok.com/@velocity_x/video/123", eventId: "1", status: "scored", scores: { quality: 94, originality: 91, impact: 96 }, judge: "Judge_Alpha" },
  { id: "2", alias: "FRAME_HUNTER", platform: "youtube", platformLink: "https://youtube.com/shorts/abc", eventId: "1", status: "scored", scores: { quality: 88, originality: 95, impact: 89 }, judge: "Judge_Beta" },
  { id: "3", alias: "CUT_MASTER", platform: "tiktok", platformLink: "https://tiktok.com/@cutmaster/video/456", eventId: "1", status: "pending" },
  { id: "4", alias: "SYNC_WAVE", platform: "instagram", platformLink: "https://instagram.com/reel/xyz", eventId: "1", status: "pending" },
  { id: "5", alias: "LOOP_KING", platform: "tiktok", platformLink: "https://tiktok.com/@loopking/video/789", eventId: "1", status: "pending" },
];

export default function AdminPage() {
  const [events, setEvents] = useState(mockEvents);
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [activeEventFilter, setActiveEventFilter] = useState<string>("1");
  const [scoringSubmission, setScoringSubmission] = useState<string | null>(null);
  const [scores, setScores] = useState({ quality: 80, originality: 80, impact: 80 });
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

  const handleScoreSubmission = (submissionId: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: "scored" as const, scores: { ...scores }, judge: "Admin" }
          : s
      )
    );
    setScoringSubmission(null);
    setScores({ quality: 80, originality: 80, impact: 80 });
  };

  const filteredSubmissions = submissions.filter((s) => s.eventId === activeEventFilter);
  const pendingCount = filteredSubmissions.filter((s) => s.status === "pending").length;
  const scoredCount = filteredSubmissions.filter((s) => s.status === "scored").length;

  const calculateQOI = (q: number, o: number, i: number) => Math.round((q + o + i) / 3 * 10) / 10;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold">OPERATOR PANEL</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Admin Access • Restricted
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Event Control */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Event Control
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`bg-card border rounded-lg p-4 ${
                  event.status === "live" ? "border-green-500/30" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Status: <span className={`uppercase font-semibold ${
                        event.status === "live" ? "text-green-500" : 
                        event.status === "pending" ? "text-gold" : "text-muted-foreground"
                      }`}>{event.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveEventFilter(event.id)}
                      className={`p-2 rounded-lg ${
                        activeEventFilter === event.id ? "bg-gold text-black" : "bg-surface-1"
                      }`}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleEvent(event.id)}
                      className={`p-2 rounded-lg ${
                        event.status === "live"
                          ? "bg-green-600"
                          : event.status === "pending"
                          ? "bg-gold text-black"
                          : "bg-muted"
                      }`}
                    >
                      {event.status === "live" ? (
                        <Unlock size={16} />
                      ) : event.status === "closed" ? (
                        <Lock size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submissions & Judging */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Submissions • {events.find(e => e.id === activeEventFilter)?.title}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gold">{pendingCount} pending</span>
              <span className="text-green-500">{scoredCount} scored</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`bg-card border rounded-lg overflow-hidden ${
                  submission.status === "scored" ? "border-green-500/30" : "border-border"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{submission.alias}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {submission.platform}
                        </span>
                        <a 
                          href={submission.platformLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gold text-xs hover:underline"
                        >
                          View Edit →
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.status === "scored" ? (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold">
                            {calculateQOI(submission.scores!.quality, submission.scores!.originality, submission.scores!.impact)}
                          </p>
                          <p className="text-[10px] text-green-500 uppercase">Scored</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setScoringSubmission(
                            scoringSubmission === submission.id ? null : submission.id
                          )}
                          className="px-3 py-2 bg-gold text-black rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          Score
                          {scoringSubmission === submission.id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scoring Panel */}
                {scoringSubmission === submission.id && (
                  <div className="border-t border-border p-4 bg-surface-1 space-y-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      QOI Scoring
                    </p>
                    
                    {/* Quality */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Quality (Q)</label>
                        <span className="text-gold font-bold">{scores.quality}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scores.quality}
                        onChange={(e) => setScores({ ...scores, quality: Number(e.target.value) })}
                        className="w-full accent-gold"
                      />
                    </div>

                    {/* Originality */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Originality (O)</label>
                        <span className="text-gold font-bold">{scores.originality}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scores.originality}
                        onChange={(e) => setScores({ ...scores, originality: Number(e.target.value) })}
                        className="w-full accent-gold"
                      />
                    </div>

                    {/* Impact */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Impact (I)</label>
                        <span className="text-gold font-bold">{scores.impact}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scores.impact}
                        onChange={(e) => setScores({ ...scores, impact: Number(e.target.value) })}
                        className="w-full accent-gold"
                      />
                    </div>

                    {/* QOI Preview */}
                    <div className="flex items-center justify-between py-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">QOI Total</span>
                      <span className="text-2xl font-black text-gold">
                        {calculateQOI(scores.quality, scores.originality, scores.impact)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleScoreSubmission(submission.id)}
                      className="w-full py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Save Score
                    </button>
                  </div>
                )}

                {/* Scored Details */}
                {submission.status === "scored" && submission.scores && (
                  <div className="border-t border-border px-4 py-3 bg-surface-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span>Q: <span className="text-foreground font-semibold">{submission.scores.quality}</span></span>
                      <span>O: <span className="text-foreground font-semibold">{submission.scores.originality}</span></span>
                      <span>I: <span className="text-foreground font-semibold">{submission.scores.impact}</span></span>
                    </div>
                    <span className="text-muted-foreground">by {submission.judge}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Create Activation */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Create Activation
          </h2>
          <button className="w-full bg-card border border-dashed border-border rounded-lg p-6 text-center hover:border-gold/50 transition-colors">
            <Plus size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">New Event</p>
          </button>
        </section>

        {/* Judge Assignment */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Judge Assignment
          </h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {["Judge_Alpha", "Judge_Beta", "Judge_Gamma"].map((judge) => (
              <div key={judge} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                    {judge.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{judge}</span>
                </div>
                <span className="text-xs text-green-500">Active</span>
              </div>
            ))}
          </div>
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
                  Freeze current standings permanently
                </p>
              </div>
              <button className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-semibold flex items-center gap-1">
                <Lock size={14} />
                Lock
              </button>
            </div>
          </div>
        </section>

        {/* Export */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Export
          </h2>
          <button className="w-full bg-gold text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
            <Download size={18} />
            Export Winners List
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            CSV export for payout processing
          </p>
        </section>
      </div>
    </div>
  );
}
