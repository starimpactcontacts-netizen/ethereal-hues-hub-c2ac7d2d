import { ArrowLeft, Clapperboard, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickClipEditor from "@/components/loopgate/QuickClipEditor";
import SoftwareLauncherGrid from "@/components/loopgate/SoftwareLauncherGrid";
import SEO from "@/components/SEO";

export default function StudioPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO
        title="Studio — Loopgate"
        description="Edit clips, apply filters, and submit to competitions — all inside Loopgate."
      />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-gold" />
              Studio
            </h1>
            <p className="text-[10px] text-muted-foreground">Edit, create, submit</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Submit Shortcut */}
        <button
          onClick={() => navigate("/events")}
          className="w-full bg-gold/10 border border-gold/30 p-3 flex items-center gap-3 hover:bg-gold/15 transition-all group card-hover"
        >
          <div className="w-10 h-10 bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gold">Ready to Submit?</p>
            <p className="text-[10px] text-muted-foreground">View active competitions & battles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gold opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Quick Clip Editor */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-base text-foreground">Quick Editor</h2>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gold/15 text-gold">Browser</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Trim, add filters, text overlays & music — then export and submit. No downloads needed.
          </p>
          <QuickClipEditor />
        </section>

        {/* Software Launcher */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-base text-foreground">Editing Software</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Need something more powerful? Launch your favorite editor directly.
          </p>
          <SoftwareLauncherGrid />
        </section>

        {/* How it works */}
        <div className="bg-surface-1 border border-border p-3 space-y-2">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Studio Flow</h3>
          <ul className="space-y-1.5">
            {[
              "Upload or record a clip",
              "Trim, apply filters & add text",
              "Export as WebM — 100% in-browser",
              "Submit directly to a competition",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <span className="w-4 h-4 bg-gold/10 text-gold flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
