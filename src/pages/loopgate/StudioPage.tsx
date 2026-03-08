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

    return new Promise((resolve) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(objUrl);
        resolve({ thumbnail: null, duration: 0, resolution: "" });
      }, 7000);

      const finish = (payload: Pick<StudioProject, "thumbnail" | "duration" | "resolution">) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objUrl);
        resolve(payload);
      };

      type ThumbnailCandidate = { url: string; score: number };

      const captureThumbnail = (): ThumbnailCandidate | null => {
        if (vid.videoWidth === 0 || vid.videoHeight === 0) return null;

        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = Math.max(180, Math.round(320 * (vid.videoHeight / vid.videoWidth)));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = 96;
        sampleCanvas.height = 54;
        const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
        if (!sampleCtx) return null;

        sampleCtx.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
        const data = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;

        let lumaSum = 0;
        let lumaSqSum = 0;
        let maxLuma = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lumaSum += luma;
          lumaSqSum += luma * luma;
          if (luma > maxLuma) maxLuma = luma;
        }

        const totalPixels = data.length / 4;
        const avgLuma = lumaSum / totalPixels;
        const variance = Math.max(0, lumaSqSum / totalPixels - avgLuma * avgLuma);

        const url = canvas.toDataURL("image/jpeg", 0.78);
        if (url.length < 900) return null;

        const score = avgLuma * 0.5 + variance * 0.95 + maxLuma * 0.2;
        return { url, score };
      };

      const seekTo = (time: number) =>
        new Promise<void>((resolveSeek, rejectSeek) => {
          const duration = Number.isFinite(vid.duration) ? vid.duration : 0;
          const target = Math.max(0, Math.min(time, Math.max(duration - 0.05, 0)));

          let seekTimeout: ReturnType<typeof setTimeout>;
          const onSeeked = () => {
            clearTimeout(seekTimeout);
            resolveSeek();
          };

          vid.addEventListener("seeked", onSeeked, { once: true });

          seekTimeout = setTimeout(() => {
            vid.removeEventListener("seeked", onSeeked);
            rejectSeek(new Error("seek timeout"));
          }, 1500);

          try {
            vid.currentTime = target;
          } catch (err) {
            clearTimeout(seekTimeout);
            vid.removeEventListener("seeked", onSeeked);
            rejectSeek(err);
          }
        });

      const waitForPaint = () =>
        new Promise<void>((resolvePaint) => {
          if ("requestVideoFrameCallback" in vid) {
            (vid as any).requestVideoFrameCallback(() => resolvePaint());
          } else {
            setTimeout(() => resolvePaint(), 140);
          }
        });

      vid.onloadedmetadata = async () => {
        const duration = Number.isFinite(vid.duration) ? vid.duration : 0;
        const resolution = vid.videoWidth > 0 && vid.videoHeight > 0 ? `${vid.videoWidth}x${vid.videoHeight}` : "";

        if (vid.readyState < 2) {
          try {
            await new Promise<void>((resolveLoadedData) => {
              vid.addEventListener("loadeddata", () => resolveLoadedData(), { once: true });
            });
          } catch {
            // continue
          }
        }

        const d = Math.max(duration, 1);
        const randomPoints = Array.from({ length: 6 }, () => d * (0.12 + Math.random() * 0.76));
        const fixedPoints = [d * 0.18, d * 0.33, d * 0.5, d * 0.66, d * 0.82, Math.min(3, d * 0.25)];
        const candidates = [...randomPoints, ...fixedPoints];

        let bestShot: ThumbnailCandidate | null = null;

        for (const t of candidates) {
          try {
            await seekTo(t);
            await waitForPaint();
            const shot = captureThumbnail();
            if (!shot) continue;
            if (!bestShot || shot.score > bestShot.score) bestShot = shot;
            if (shot.score > 260) break;
          } catch {
            // try next
          }
        }

        if (bestShot) {
          finish({ thumbnail: bestShot.url, duration, resolution });
          return;
        }

        try {
          await vid.play();
          await new Promise((r) => setTimeout(r, 320));
          vid.pause();
          await waitForPaint();
          const shot = captureThumbnail();
          finish({ thumbnail: shot?.url ?? null, duration, resolution });
        } catch {
          finish({ thumbnail: null, duration, resolution });
        }
      };

      vid.onerror = () => finish({ thumbnail: null, duration: 0, resolution: "" });
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
