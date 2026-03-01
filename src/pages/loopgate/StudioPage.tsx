import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import LoadingScreen from "@/components/loopgate/LoadingScreen";
import SoloModeBanner from "@/components/loopgate/SoloModeBanner";
import StudioHome, { type StudioProject, saveStudioProject } from "@/components/loopgate/StudioHome";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Film, Upload } from "lucide-react";

const StudioNLE = lazy(() => import("@/components/loopgate/StudioNLE"));
const QuickClipEditor = lazy(() => import("@/components/loopgate/QuickClipEditor"));

export default function StudioPage() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const soloId = searchParams.get("solo");

  const [editorOpen, setEditorOpen] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewProject = useCallback(() => {
    // Open native file picker
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (f.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB"); return; }

    // Save as a project
    const project: StudioProject = {
      id: crypto.randomUUID(),
      name: f.name.replace(/\.[^/.]+$/, ""),
      thumbnail: null,
      lastModified: Date.now(),
      duration: 0,
      resolution: "",
      fileSize: f.size,
    };

    // Generate thumbnail from video
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(f);
    vid.muted = true;
    vid.preload = "auto";
    vid.onloadedmetadata = () => {
      project.duration = vid.duration;
      project.resolution = `${vid.videoWidth}x${vid.videoHeight}`;
      vid.currentTime = Math.min(1, vid.duration * 0.1);
    };
    vid.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = Math.round(320 * (vid.videoHeight / vid.videoWidth));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        project.thumbnail = canvas.toDataURL("image/jpeg", 0.6);
      }
      saveStudioProject(project);
      URL.revokeObjectURL(vid.src);
      setInitialFile(f);
      setEditorOpen(true);
    };
    vid.onerror = () => {
      // Still open even if thumbnail fails
      saveStudioProject(project);
      setInitialFile(f);
      setEditorOpen(true);
    };
  }, []);

  const [pendingProject, setPendingProject] = useState<StudioProject | null>(null);

  const handleOpenProject = useCallback((project: StudioProject) => {
    // Update last modified
    project.lastModified = Date.now();
    saveStudioProject(project);
    setPendingProject(project);
  }, []);

  const handleConfirmReimport = useCallback(() => {
    if (!pendingProject) return;
    setPendingProject(null);
    handleNewProject();
  }, [pendingProject, handleNewProject]);

  return (
    <>
      <SEO
        title="Studio — Loopgate"
        description="Edit clips, apply filters, and submit to competitions — all inside Loopgate."
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {!editorOpen ? (
        <StudioHome onNewProject={handleNewProject} onOpenProject={handleOpenProject} />
      ) : (
        <Suspense fallback={<LoadingScreen minimal />}>
          {isMobile ? (
            <div className="min-h-screen bg-background pb-24 px-4 pt-4 space-y-3">
              {soloId && <SoloModeBanner soloId={soloId} />}
              <QuickClipEditor initialFile={initialFile} onBack={() => { setEditorOpen(false); setInitialFile(null); }} />
            </div>
          ) : (
            <div className="flex flex-col h-screen">
              {soloId && (
                <div className="shrink-0">
                  <SoloModeBanner soloId={soloId} />
                </div>
              )}
              <div className="flex-1 min-h-0">
                <StudioNLE initialFile={initialFile} onBack={() => { setEditorOpen(false); setInitialFile(null); }} />
              </div>
            </div>
          )}
        </Suspense>
      )}

      {/* Re-import dialog */}
      <Dialog open={!!pendingProject} onOpenChange={(open) => { if (!open) setPendingProject(null); }}>
        <DialogContent className="bg-black border-white/10 max-w-sm">
          <DialogTitle className="text-white font-semibold text-base flex items-center gap-2">
            <Film className="w-4 h-4" style={{ color: '#9999FF' }} />
            Re-select Video File
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm leading-relaxed">
            Browser storage can't hold video files between sessions. Select <span className="text-white/80 font-medium">"{pendingProject?.name}"</span> from your device to continue editing.
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
