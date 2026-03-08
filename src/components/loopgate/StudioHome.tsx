import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Film, Trash2, ChevronLeft, MoreVertical,
  Layers, Scissors, Type, Music, Play, Upload,
  Crop, SlidersHorizontal, Palette, ExternalLink, Bug, Sparkles,
  Wand2, ArrowRight
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ActiveSoloBanner from "./ActiveSoloBanner";
import StudioSubmitHub from "./StudioSubmitHub";
import GatePattern from "./GatePattern";
import { toast } from "sonner";
import { deleteVideoFile } from "@/lib/studioFileStore";

export type StudioProject = {
  id: string;
  name: string;
  thumbnail: string | null;
  lastModified: number;
  duration: number;
  resolution: string;
  fileSize: number;
};

const STORAGE_KEY = "loopgate_studio_projects";
const MONO_ACCENT = "hsl(0 0% 95%)";
const MONO_ACCENT_DIM = "hsl(0 0% 100% / 0.08)";
const MONO_ACCENT_BORDER = "hsl(0 0% 100% / 0.2)";

export function getStudioProjects(): StudioProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StudioProject[];
  } catch { return []; }
}

export function saveStudioProject(project: StudioProject) {
  const projects = getStudioProjects().filter(p => p.id !== project.id);
  projects.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
}

export function deleteStudioProject(id: string) {
  const projects = getStudioProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CAPABILITIES = [
  { icon: Scissors, label: "Trim & Split", desc: "Frame-perfect cuts" },
  { icon: Palette, label: "24+ Filters", desc: "Cinema-grade LUTs" },
  { icon: Type, label: "50+ Fonts", desc: "Animated text overlays" },
  { icon: Music, label: "Audio Mix", desc: "Multi-track mixing" },
  { icon: Crop, label: "Crop & Transform", desc: "9:16, 4:3, custom" },
  { icon: SlidersHorizontal, label: "Color Grade", desc: "13-point grading" },
];

interface StudioHomeProps {
  onNewProject: () => void;
  onOpenProject: (project: StudioProject) => void;
}

export default function StudioHome({ onNewProject, onOpenProject }: StudioHomeProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setProjects(getStudioProjects());
  }, []);

  const handleDelete = (id: string) => {
    deleteStudioProject(id);
    deleteVideoFile(id).catch(() => {}); // Clean up IndexedDB too
    setProjects(prev => prev.filter(p => p.id !== id));
    setContextMenu(null);
    toast.success("Project deleted");
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("video/")) onNewProject();
  }, [onNewProject]);

  const recentProjects = projects.slice(0, 6);
  const hasProjects = recentProjects.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#06060a" }}>

      {/* ═══════════════════ TOP BAR ═══════════════════ */}
      <div className="sticky top-0 z-30" style={{ background: "rgba(6,6,10,0.92)", backdropFilter: "blur(24px) saturate(1.6)" }}>
        <div className={`flex items-center justify-between ${isMobile ? "px-4 py-3" : "max-w-[1100px] mx-auto px-6 py-3"}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/hub")} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/30" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(0 0% 96%), hsl(0 0% 68%))" }}>
                <Layers className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-white/90 text-[15px] tracking-tight" style={{ fontFamily: "'Teko', sans-serif", fontSize: "20px", letterSpacing: "0.04em" }}>STUDIO</span>
              <span className="text-[7px] font-bold tracking-[0.25em] uppercase px-1.5 py-0.5 rounded"
                style={{ color: MONO_ACCENT, background: MONO_ACCENT_DIM, border: `1px solid ${MONO_ACCENT_BORDER}` }}
              >NLE</span>
            </div>
          </div>
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, hsl(0 0% 96%), hsl(0 0% 72%))", boxShadow: "0 4px 20px hsl(0 0% 100% / 0.2)" }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isMobile ? "New" : "New Project"}
          </button>
        </div>
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.18), transparent)" }} />
      </div>

      {/* ═══════════════════ SUBMIT HUB ═══════════════════ */}
      <div className={`${isMobile ? "px-3 pt-3" : "max-w-[1100px] mx-auto px-6 pt-5"}`}>
        <StudioSubmitHub />
      </div>

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <div className={`${isMobile ? "px-4 pt-5 pb-20" : "max-w-[1100px] mx-auto px-6 pt-8 pb-20"}`}>

        {/* Active Solo */}
        <ActiveSoloBanner />

        {/* ═══════════════════ SECTION: CREATE ═══════════════════ */}
        <section className={`${isMobile ? "mb-8" : "mb-12"}`}>
          <SectionHeader icon={Plus} title="Create" subtitle="Start a new editing project" />

          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {/* Import Hero */}
            <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <motion.button
                onClick={onNewProject}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl overflow-hidden relative group cursor-pointer h-full min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 text-left"
                style={{
                  background: isDragOver
                    ? "linear-gradient(135deg, hsl(0 0% 100% / 0.12), hsl(0 0% 4% / 0.96))"
                    : "linear-gradient(160deg, hsl(0 0% 100% / 0.06) 0%, hsl(0 0% 4% / 0.96) 42%)",
                  border: isDragOver ? `2px dashed ${MONO_ACCENT_BORDER}` : "1px solid hsl(0 0% 100% / 0.08)",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.1), transparent 70%)" }}
                />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ background: "linear-gradient(135deg, hsl(0 0% 96%), hsl(0 0% 74%))", boxShadow: "0 12px 40px hsl(0 0% 100% / 0.25)" }}
                  >
                    <Upload className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white text-[15px] tracking-tight">Import Video</p>
                    <p className="text-[11px] text-white/25 mt-1">Drag & drop or click to browse</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {["MP4", "MOV", "WEBM"].map(fmt => (
                      <span key={fmt} className="text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded"
                         style={{ color: "hsl(0 0% 8%)", background: "hsl(0 0% 100% / 0.82)", border: "1px solid hsl(0 0% 100% / 0.25)" }}
                      >{fmt}</span>
                    ))}
                    <span className="text-[8px] text-white/15 ml-1">up to 2GB</span>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-2 gap-2">
              {CAPABILITIES.map((cap, i) => (
                <motion.div
                  key={cap.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl transition-colors hover:bg-white/[0.025]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(124,106,255,0.06)" }}
                  >
                    <cap.icon className="w-3.5 h-3.5" style={{ color: "#7C6AFF" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white/70 leading-tight">{cap.label}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{cap.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ SECTION: RECENT PROJECTS ═══════════════════ */}
        {hasProjects && (
          <section className={`${isMobile ? "mb-8" : "mb-12"}`}>
            <SectionHeader
              icon={Clock}
              title="Recent Projects"
              subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""} saved locally`}
            />

            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {recentProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                  onOpen={onOpenProject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════ SECTION: RESOURCES ═══════════════════ */}
        <section>
          <SectionHeader icon={Sparkles} title="Resources" subtitle="Pro-grade editing tools & links" />

          <div className={`grid gap-2.5 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {[
              { name: "CapCut", url: "https://www.capcut.com", desc: "Free, mobile + desktop", accent: "#00E5FF" },
              { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", desc: "Pro-grade, free tier", accent: "#FF6B35" },
              { name: "Premiere Pro", url: "https://www.adobe.com/products/premiere.html", desc: "Industry standard", accent: "#9B8AFF" },
              { name: "After Effects", url: "https://www.adobe.com/products/aftereffects.html", desc: "Motion & VFX", accent: "#CF96FD" },
            ].map(editor => (
              <a key={editor.name} href={editor.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-white/[0.03] group/link"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${editor.accent}0A` }}>
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: editor.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-white/50 group-hover/link:text-white/80 transition-colors">{editor.name}</p>
                  <p className="text-[10px] text-white/20">{editor.desc}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-white/10 group-hover/link:text-white/30 transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>

          {/* Bug report */}
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ background: "rgba(255,180,0,0.02)", border: "1px solid rgba(255,180,0,0.05)" }}
          >
            <Bug className="w-3 h-3 text-amber-500/30 flex-shrink-0" />
            <p className="text-[10px] text-white/20">
              Found a bug? <span className="text-amber-500/40 font-medium">Report it in your Unit chat or DMs</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════ SECTION HEADER ═══════════════════ */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: "#7C6AFF" }} />
        <h2 className="font-bold text-white/90 tracking-tight" style={{ fontFamily: "'Teko', sans-serif", fontSize: "22px", letterSpacing: "0.03em" }}>{title.toUpperCase()}</h2>
      </div>
      <p className="text-[11px] text-white/25 ml-6">{subtitle}</p>
      <div className="mt-3 h-px" style={{ background: "linear-gradient(90deg, rgba(124,106,255,0.2), transparent 60%)" }} />
    </div>
  );
}

/* ═══════════════════ PROJECT CARD ═══════════════════ */
function ProjectCard({
  project, index, contextMenu, setContextMenu, onOpen, onDelete,
}: {
  project: StudioProject;
  index: number;
  contextMenu: string | null;
  setContextMenu: (id: string | null) => void;
  onOpen: (p: StudioProject) => void;
  onDelete: (id: string) => void;
}) {
  const hasThumbnail = project.thumbnail && project.thumbnail.length > 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative"
    >
      <button
        onClick={() => onOpen(project)}
        className="w-full text-left rounded-xl overflow-hidden transition-all duration-300 hover:border-[rgba(124,106,255,0.25)] hover:shadow-[0_8px_40px_rgba(124,106,255,0.08)] hover:-translate-y-0.5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden">
          {hasThumbnail ? (
            <img src={project.thumbnail!} alt={project.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(124,106,255,0.06), rgba(10,10,16,1) 60%)" }}
            >
              <Film className="w-7 h-7 text-white/8" />
            </div>
          )}

          {project.duration > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white/90"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            >
              {formatDuration(project.duration)}
            </div>
          )}

          {project.resolution && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider"
              style={{ color: "#7C6AFF", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
              {project.resolution.includes("1920") ? "1080p" : project.resolution.includes("3840") ? "4K" : project.resolution.includes("1280") ? "720p" : project.resolution.split("x")[1] + "p"}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(124,106,255,0.85)", boxShadow: "0 4px 20px rgba(124,106,255,0.4)" }}
            >
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[12px] font-semibold text-white/80 truncate leading-tight">{project.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-white/20 font-medium">{formatTimeAgo(project.lastModified)}</span>
            {project.fileSize > 0 && (
              <>
                <span className="text-white/8">·</span>
                <span className="text-[10px] text-white/20 font-medium">{formatFileSize(project.fileSize)}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Context menu */}
      <button
        onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
        className="absolute top-2 right-2 p-1.5 rounded-md text-white/25 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-all z-10"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      >
        <MoreVertical className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {contextMenu === project.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-10 right-2 z-20 rounded-lg shadow-2xl overflow-hidden"
            style={{ background: "rgba(14,14,20,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 w-full transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete Project
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
