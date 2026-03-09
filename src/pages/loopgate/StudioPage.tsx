import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LoadingScreen from "@/components/loopgate/LoadingScreen";
import SoloModeBanner from "@/components/loopgate/SoloModeBanner";
import StudioHome, { type StudioProject, saveStudioProject } from "@/components/loopgate/StudioHome";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Film, Upload, Target, ArrowRight, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveVideoFile, loadVideoFile, deleteVideoFile } from "@/lib/studioFileStore";
import StudioCrashBoundary from "@/components/loopgate/studio/StudioCrashBoundary";
import AutoEditWizard from "@/components/loopgate/studio/AutoEditWizard";

const StudioNLE = lazy(() => import("@/components/loopgate/StudioNLE"));
const QuickClipEditor = lazy(() => import("@/components/loopgate/QuickClipEditor"));

interface ActiveMission {
  id: string;
  song_name: string;
  artist_name: string;
}

export default function StudioPage() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const soloId = searchParams.get("solo");
  const missionId = searchParams.get("mission");

  const [editorOpen, setEditorOpen] = useState(false);
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [missionDismissed, setMissionDismissed] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [autoEditOpen, setAutoEditOpen] = useState(false);

  // Fetch mission data if mission param present
  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, featured_artists(name)')
        .eq('id', missionId)
        .single();
      if (data) {
        const d = data as any;
        setActiveMission({ id: d.id, song_name: d.song_name, artist_name: d.featured_artists?.name || 'Unknown' });
      }
    })();
  }, [missionId]);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setInitialFile(null);
    setActiveProjectId(null);
  }, []);

  const handleNewProject = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, []);

  const extractProjectMetadata = useCallback(async (file: File): Promise<Pick<StudioProject, "thumbnail" | "duration" | "resolution">> => {
    const objUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = objUrl;
    vid.muted = true;
    vid.preload = "auto";
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";

    return new Promise((resolve) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn("[Studio] Thumbnail extraction timed out");
        URL.revokeObjectURL(objUrl);
        resolve({ thumbnail: null, duration: 0, resolution: "" });
      }, 12000); // Increased timeout to 12s

      const finish = (payload: Pick<StudioProject, "thumbnail" | "duration" | "resolution">) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objUrl);
        resolve(payload);
      };

      type ThumbnailCandidate = { url: string; score: number };

      const captureThumbnail = (): ThumbnailCandidate | null => {
        try {
          if (vid.videoWidth === 0 || vid.videoHeight === 0) return null;

          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = Math.max(180, Math.round(320 * (vid.videoHeight / vid.videoWidth)));
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return null;

          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

          // Check if canvas has actual content (not just black)
          const testData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 10, 10).data;
          let hasContent = false;
          for (let i = 0; i < testData.length; i += 4) {
            if (testData[i] > 5 || testData[i + 1] > 5 || testData[i + 2] > 5) {
              hasContent = true;
              break;
            }
          }
          if (!hasContent) return null;

          const url = canvas.toDataURL("image/jpeg", 0.8);
          if (url.length < 1000) return null;

          // Simple scoring based on center brightness
          const sampleCtx = canvas.getContext("2d");
          if (!sampleCtx) return { url, score: 100 };
          
          const centerData = sampleCtx.getImageData(
            Math.floor(canvas.width * 0.25), 
            Math.floor(canvas.height * 0.25), 
            Math.floor(canvas.width * 0.5), 
            Math.floor(canvas.height * 0.5)
          ).data;

          let totalBrightness = 0;
          let variance = 0;
          const pixelCount = centerData.length / 4;
          
          for (let i = 0; i < centerData.length; i += 16) { // Sample every 4th pixel for speed
            const brightness = (centerData[i] + centerData[i + 1] + centerData[i + 2]) / 3;
            totalBrightness += brightness;
          }
          const avgBrightness = totalBrightness / (pixelCount / 4);
          
          // Score: prefer frames that aren't too dark or too bright
          const score = Math.min(avgBrightness, 255 - avgBrightness) + 50;
          
          return { url, score };
        } catch (err) {
          console.warn("[Studio] Thumbnail capture error:", err);
          return null;
        }
      };

      const waitForFrame = () =>
        new Promise<void>((resolveFrame) => {
          if ("requestVideoFrameCallback" in vid) {
            (vid as any).requestVideoFrameCallback(() => resolveFrame());
          } else {
            // Fallback: wait a bit for the frame to render
            requestAnimationFrame(() => {
              setTimeout(() => resolveFrame(), 100);
            });
          }
        });

      vid.onloadeddata = async () => {
        const duration = Number.isFinite(vid.duration) ? vid.duration : 0;
        const resolution = vid.videoWidth > 0 && vid.videoHeight > 0 ? `${vid.videoWidth}x${vid.videoHeight}` : "";

        // Strategy 1: Try simple play + capture
        try {
          vid.currentTime = Math.min(1, duration * 0.2);
          await new Promise<void>((r) => vid.addEventListener("seeked", () => r(), { once: true }));
          await waitForFrame();
          
          const shot = captureThumbnail();
          if (shot && shot.url.length > 1000) {
            console.log("[Studio] Thumbnail captured on first try");
            finish({ thumbnail: shot.url, duration, resolution });
            return;
          }
        } catch (e) {
          console.warn("[Studio] First thumbnail attempt failed:", e);
        }

        // Strategy 2: Play briefly then capture
        try {
          vid.currentTime = 0;
          await vid.play();
          await new Promise((r) => setTimeout(r, 500));
          vid.pause();
          await waitForFrame();
          
          const shot = captureThumbnail();
          if (shot && shot.url.length > 1000) {
            console.log("[Studio] Thumbnail captured via play");
            finish({ thumbnail: shot.url, duration, resolution });
            return;
          }
        } catch (e) {
          console.warn("[Studio] Play-capture attempt failed:", e);
        }

        // Strategy 3: Multiple seek attempts
        const seekPoints = [0.25, 0.5, 0.33, 0.1, 0.75].map(p => duration * p);
        let bestShot: ThumbnailCandidate | null = null;

        for (const t of seekPoints) {
          try {
            vid.currentTime = Math.max(0.1, Math.min(t, duration - 0.1));
            await new Promise<void>((r, rej) => {
              const timeout = setTimeout(() => rej(new Error("seek timeout")), 2000);
              vid.addEventListener("seeked", () => { clearTimeout(timeout); r(); }, { once: true });
            });
            await waitForFrame();
            
            const shot = captureThumbnail();
            if (shot) {
              if (!bestShot || shot.score > bestShot.score) {
                bestShot = shot;
              }
              if (shot.score > 150) break; // Good enough
            }
          } catch {
            continue;
          }
        }

        if (bestShot) {
          console.log("[Studio] Thumbnail captured via multi-seek");
          finish({ thumbnail: bestShot.url, duration, resolution });
        } else {
          console.warn("[Studio] All thumbnail strategies failed");
          finish({ thumbnail: null, duration, resolution });
        }
      };

      vid.onerror = (e) => {
        console.error("[Studio] Video load error:", e);
        finish({ thumbnail: null, duration: 0, resolution: "" });
      };
    });
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (f.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB"); return; }

    const projectId = crypto.randomUUID();

    void (async () => {
      // Save video file to IndexedDB immediately
      try {
        await saveVideoFile(projectId, f);
      } catch (err) {
        console.warn("Could not cache video file:", err);
      }

      const metadata = await extractProjectMetadata(f);

      const project: StudioProject = {
        id: projectId,
        name: f.name.replace(/\.[^/.]+$/, ""),
        thumbnail: metadata.thumbnail,
        lastModified: Date.now(),
        duration: metadata.duration,
        resolution: metadata.resolution,
        fileSize: f.size,
      };

      saveStudioProject(project);
      setActiveProjectId(projectId);
      setInitialFile(f);
      setEditorOpen(true);
    })();
  }, [extractProjectMetadata]);

  const [pendingProject, setPendingProject] = useState<StudioProject | null>(null);
  const reimportInputRef = useRef<HTMLInputElement>(null);

  const handleOpenProject = useCallback(async (project: StudioProject) => {
    project.lastModified = Date.now();
    saveStudioProject(project);

    // Try loading from IndexedDB first
    setLoadingProject(true);
    try {
      const cachedFile = await loadVideoFile(project.id);
      if (cachedFile) {
        // File found in IndexedDB — open directly, no re-import needed!
        setActiveProjectId(project.id);
        setInitialFile(cachedFile);
        setEditorOpen(true);
        setLoadingProject(false);
        return;
      }
    } catch (err) {
      console.warn("Failed to load cached file:", err);
    }
    setLoadingProject(false);

    // Fall back to re-import dialog
    setPendingProject(project);
  }, []);

  const handleConfirmReimport = useCallback(() => {
    if (!pendingProject) return;
    const input = reimportInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, [pendingProject]);

  const handleReimportFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }

    const projectToRefresh = pendingProject;

    setPendingProject(null);
    setInitialFile(f);
    setActiveProjectId(projectToRefresh?.id ?? null);
    setEditorOpen(true);

    if (!projectToRefresh) return;

    void (async () => {
      // Save to IndexedDB so next time it auto-loads
      try {
        await saveVideoFile(projectToRefresh.id, f);
      } catch (err) {
        console.warn("Could not cache re-imported video:", err);
      }

      const metadata = await extractProjectMetadata(f);
      saveStudioProject({
        ...projectToRefresh,
        name: projectToRefresh.name || f.name.replace(/\.[^/.]+$/, ""),
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        resolution: metadata.resolution,
        fileSize: f.size,
        lastModified: Date.now(),
      });
    })();
  }, [extractProjectMetadata, pendingProject]);

  return (
    <>
      <SEO
        title="Studio — Loopgate"
        description="Edit clips, apply filters, and submit to competitions — all inside Loopgate."
      />

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelected} />
      <input ref={reimportInputRef} type="file" accept="video/*" className="hidden" onChange={handleReimportFileSelected} />

      {/* Active Mission Sticky Banner */}
      {activeMission && !missionDismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/95 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-white shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">Active Mission</span>
            <p className="text-xs font-bold text-white truncate">{activeMission.artist_name} — {activeMission.song_name}</p>
          </div>
          <Link to={`/mission/${activeMission.id}`} className="shrink-0 text-[9px] font-black text-white bg-white/20 px-2 py-1 flex items-center gap-1 hover:bg-white/30 transition-colors">
            Submit <ArrowRight className="w-3 h-3" />
          </Link>
          <button onClick={() => setMissionDismissed(true)} className="shrink-0 text-white/50 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading overlay when restoring from IndexedDB */}
      {loadingProject && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#9999FF] animate-spin" />
            <p className="text-white/70 text-sm font-medium">Restoring project…</p>
          </div>
        </div>
      )}

      {!editorOpen ? (
        <StudioHome onNewProject={handleNewProject} onOpenProject={handleOpenProject} />
      ) : (
        <Suspense fallback={<LoadingScreen minimal />}>
          {isMobile ? (
            <div className={`min-h-screen bg-background pb-24 px-4 space-y-3 ${activeMission && !missionDismissed ? 'pt-14' : 'pt-4'}`}>
              {soloId && <SoloModeBanner soloId={soloId} />}
              <StudioCrashBoundary onReset={handleCloseEditor}>
                <QuickClipEditor initialFile={initialFile} onBack={handleCloseEditor} />
              </StudioCrashBoundary>
            </div>
          ) : (
            <div className={`flex flex-col h-screen ${activeMission && !missionDismissed ? 'pt-10' : ''}`}>
              {soloId && (
                <div className="shrink-0">
                  <SoloModeBanner soloId={soloId} />
                </div>
              )}
              <div className="flex-1 min-h-0">
                <StudioCrashBoundary onReset={handleCloseEditor}>
                  <StudioNLE initialFile={initialFile} onBack={handleCloseEditor} />
                </StudioCrashBoundary>
              </div>
            </div>
          )}
        </Suspense>
      )}

      {/* Re-import dialog (fallback when IndexedDB doesn't have the file) */}
      <Dialog open={!!pendingProject} onOpenChange={(open) => { if (!open) setPendingProject(null); }}>
        <DialogContent className="bg-black border-white/10 max-w-sm">
          <DialogTitle className="text-white font-semibold text-base flex items-center gap-2">
            <Film className="w-4 h-4" style={{ color: '#9999FF' }} />
            Re-select Video File
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm leading-relaxed">
            The cached file for <span className="text-white/80 font-medium">"{pendingProject?.name}"</span> was cleared by the browser. Select it from your device to continue editing — it will be cached again for next time.
          </DialogDescription>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPendingProject(null)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReimport}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #9999FF, #7B7BFF)', boxShadow: '0 2px 12px rgba(153,153,255,0.3)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              Select File
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
