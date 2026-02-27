import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense } from "react";
import SEO from "@/components/SEO";
import LoadingScreen from "@/components/loopgate/LoadingScreen";

const StudioNLE = lazy(() => import("@/components/loopgate/StudioNLE"));
const QuickClipEditor = lazy(() => import("@/components/loopgate/QuickClipEditor"));

export default function StudioPage() {
  const isMobile = useIsMobile();

  return (
    <>
      <SEO
        title="Studio — Loopgate"
        description="Edit clips, apply filters, and submit to competitions — all inside Loopgate."
      />
      <Suspense fallback={<LoadingScreen minimal />}>
        {isMobile ? (
          <div className="min-h-screen bg-background pb-24 px-4 pt-4">
            <QuickClipEditor />
          </div>
        ) : (
          <StudioNLE />
        )}
      </Suspense>
    </>
  );
}
