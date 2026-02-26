import { ArrowLeft, Clapperboard, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import QuickClipEditor from "@/components/loopgate/QuickClipEditor";
import SoftwareLauncherGrid from "@/components/loopgate/SoftwareLauncherGrid";
import SoloModeBanner from "@/components/loopgate/SoloModeBanner";
import SEO from "@/components/SEO";

export default function StudioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const soloId = searchParams.get("solo");
  const [showSoftware, setShowSoftware] = useState(false);

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

      <div className="px-4 pt-4 space-y-4">
        {/* Solo Mode Banner */}
        {soloId && <SoloModeBanner soloId={soloId} />}

        {/* Quick Clip Editor — THE HERO */}
        <QuickClipEditor />

        {/* Submit Shortcut — compact */}
        <button
          onClick={() => navigate("/events")}
          className="w-full bg-gold/10 border border-gold/30 p-2.5 flex items-center gap-3 hover:bg-gold/15 transition-all group"
        >
          <Zap className="w-4 h-4 text-gold flex-shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-gold">Submit to Competition</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-gold opacity-50 group-hover:opacity-100" />
        </button>

        {/* Software Launcher — collapsible */}
        <button
          onClick={() => setShowSoftware(!showSoftware)}
          className="w-full flex items-center justify-between py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider">Need a desktop editor?</span>
          {showSoftware ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSoftware && <SoftwareLauncherGrid />}
      </div>
    </div>
  );
}
