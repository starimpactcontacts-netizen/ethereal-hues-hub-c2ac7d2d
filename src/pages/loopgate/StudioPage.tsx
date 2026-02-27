import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import LoadingScreen from "@/components/loopgate/LoadingScreen";
import SoloModeBanner from "@/components/loopgate/SoloModeBanner";

const StudioNLE = lazy(() => import("@/components/loopgate/StudioNLE"));
const QuickClipEditor = lazy(() => import("@/components/loopgate/QuickClipEditor"));

export default function StudioPage() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const soloId = searchParams.get("solo");

  return (
    <>
      <SEO
        title="Studio — Loopgate"
        description="Edit clips, apply filters, and submit to competitions — all inside Loopgate."
      />
      <Suspense fallback={<LoadingScreen minimal />}>
        {isMobile ? (
          <div className="min-h-screen bg-background pb-24 px-4 pt-4 space-y-3">
            {soloId && <SoloModeBanner soloId={soloId} />}
            <QuickClipEditor />
          </div>
        ) : (
          <div className="flex flex-col h-screen">
            {soloId && (
              <div className="shrink-0">
                <SoloModeBanner soloId={soloId} />
              </div>
            )}
            <div className="flex-1 min-h-0">
              <StudioNLE />
            </div>
          </div>
        )}
      </Suspense>
    </>
  );
}
