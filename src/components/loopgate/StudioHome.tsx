import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Film, Trash2, ChevronLeft, MoreVertical,
  Video, Layers, Import, Scissors, Type, Music,
  Wand2, Zap, Monitor, Smartphone, Ratio, Keyboard,
  ExternalLink, Bug, Sparkles, Play, Upload,
  Crop, SlidersHorizontal, Palette, Grid3x3
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ActiveSoloBanner from "./ActiveSoloBanner";
import StudioSubmitHub from "./StudioSubmitHub";
import { toast } from "sonner";

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
  { icon: Scissors, label: "Trim & Split", color: "#7C6AFF" },
  { icon: Palette, label: "24+ Filters", color: "#FF6B9D" },
  { icon: Type, label: "50+ Fonts", color: "#00D4AA" },
  { icon: Music, label: "Audio Mix", color: "#FFB84D" },
  { icon: Crop, label: "Crop & Transform", color: "#6BBBFF" },
  { icon: SlidersHorizontal, label: "Color Grade", color: "#FF6B6B" },
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
    setProjects(prev => prev.filter(p => p.id !== id));
    setContextMenu(null);
    toast.success("Project deleted");
  };

  // Drag & drop on import area
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("video/")) {
      // Trigger new project flow with this file
      onNewProject();
    }
  }, [onNewProject]);

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #08080c 0%, #0c0c14 50%, #08080c 100%)" }}>
      {/* ═══ SUBMISSION HUB ═══ */}
      <div className={`${isMobile ? "px-3 pt-3" : "max-w-[1200px] mx-auto px-8 pt-4"}`}>
        <StudioSubmitHub />
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.04]"
        style={{ background: "rgba(8,8,12,0.85)", backdropFilter: "blur(20px) saturate(1.4)" }}
      >
        <div className={`flex items-center justify-between ${isMobile ? "px-4 py-3" : "max-w-[1200px] mx-auto px-8 py-3"}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/hub")} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C6AFF, #5B4FCC)" }}
              >
                <Layers className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-white/90 text-sm tracking-tight">Studio</span>
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm"
                style={{ color: "#7C6AFF", background: "rgba(124,106,255,0.08)", border: "1px solid rgba(124,106,255,0.15)" }}
              >NLE</span>
            </div>
          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7C6AFF, #5B4FCC)", boxShadow: "0 4px 20px rgba(124,106,255,0.3)" }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isMobile ? "New" : "New Project"}
          </button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className={`${isMobile ? "px-4 py-5 space-y-5" : "max-w-[1200px] mx-auto px-8 py-8 space-y-8"}`}>

        {/* Active Solo */}
        <ActiveSoloBanner />

        {/* ═══ IMPORT HERO ═══ */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <motion.button
            onClick={onNewProject}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.002 }}
            className={`w-full rounded-2xl overflow-hidden relative group cursor-pointer ${isMobile ? "py-12" : "py-16"}`}
            style={{
              background: isDragOver
                ? "linear-gradient(135deg, rgba(124,106,255,0.15) 0%, rgba(20,20,28,0.9) 50%, rgba(124,106,255,0.1) 100%)"
                : "linear-gradient(135deg, rgba(124,106,255,0.04) 0%, rgba(12,12,20,0.9) 50%, rgba(124,106,255,0.03) 100%)",
              border: isDragOver ? "2px dashed rgba(124,106,255,0.5)" : "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.3s ease",
            }}
          >
            {/* Subtle animated gradient blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
              style={{ background: "radial-gradient(circle, rgba(124,106,255,0.08), transparent 70%)" }}
            />

            <div className="relative flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #7C6AFF, #5B4FCC)", boxShadow: "0 12px 40px rgba(124,106,255,0.3)" }}
                >
                  <Upload className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-base tracking-tight">Import Video</p>
                <p className="text-xs text-white/30 mt-1">Drag & drop or click to browse</p>
              </div>
              <div className="flex items-center gap-2">
                {["MP4", "MOV", "WEBM"].map(fmt => (
                  <span key={fmt} className="text-[9px] font-mono font-bold tracking-widest px-2 py-1 rounded-md"
                    style={{ color: "rgba(124,106,255,0.6)", background: "rgba(124,106,255,0.06)", border: "1px solid rgba(124,106,255,0.1)" }}
                  >{fmt}</span>
                ))}
                <span className="text-[9px] text-white/20 font-medium ml-1">up to 2GB</span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* ═══ CAPABILITIES ROW ═══ */}
        <div className={`grid gap-2 ${isMobile ? "grid-cols-3" : "grid-cols-6"}`}>
          {CAPABILITIES.map(cap => (
            <div key={cap.label} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors hover:bg-white/[0.02]"
              style={{ border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cap.color}12` }}>
                <cap.icon className="w-4 h-4" style={{ color: cap.color }} />
              </div>
              <span className="text-[10px] font-medium text-white/40 text-center">{cap.label}</span>
            </div>
          ))}
        </div>

        {/* ═══ RECENT PROJECTS ═══ */}
        {recentProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/20" />
                <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">Recent Projects</h2>
              </div>
              <span className="text-[10px] text-white/15 font-medium">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
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
          </div>
        )}

        {/* ═══ PRO EDITORS ═══ */}
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-white/20" />
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Pro Editors</h3>
          </div>
          <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
            {[
              { name: "CapCut", url: "https://www.capcut.com", desc: "Free, mobile + desktop", color: "#00E5FF" },
              { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", desc: "Pro-grade, free tier", color: "#FF6B35" },
              { name: "Premiere Pro", url: "https://www.adobe.com/products/premiere.html", desc: "Industry standard", color: "#9B8AFF" },
              { name: "After Effects", url: "https://www.adobe.com/products/aftereffects.html", desc: "Motion & VFX", color: "#CF96FD" },
            ].map(editor => (
              <a key={editor.name} href={editor.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg transition-all hover:bg-white/[0.03] group/link"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${editor.color}10` }}>
                  <ExternalLink className="w-3 h-3" style={{ color: editor.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-white/50 group-hover/link:text-white/80 transition-colors">{editor.name}</p>
                  <p className="text-[9px] text-white/20 truncate">{editor.desc}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,180,0,0.03)", border: "1px solid rgba(255,180,0,0.06)" }}
          >
            <Bug className="w-3 h-3 text-amber-500/40 flex-shrink-0" />
            <p className="text-[9px] text-white/25">
              Found a bug? <span className="text-amber-500/50 font-medium">Report it in your Unit chat or DMs</span>
            </p>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}

/* ═══ PROJECT CARD ═══ */
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
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <button
        onClick={() => onOpen(project)}
        className="w-full text-left rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,106,255,0.3)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(124,106,255,0.1)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Thumbnail area */}
        <div className="aspect-video relative overflow-hidden">
          {hasThumbnail ? (
            <img src={project.thumbnail!} alt={project.name}
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(124,106,255,0.08) 0%, rgba(12,12,20,1) 60%, rgba(124,106,255,0.04) 100%)" }}
            >
              <Film className="w-8 h-8 text-white/10" />
            </div>
          )}

          {/* Duration badge */}
          {project.duration > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white/90"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            >
              {formatDuration(project.duration)}
            </div>
          )}

          {/* Resolution badge */}
          {project.resolution && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold tracking-wider"
              style={{ color: "#7C6AFF", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
              {project.resolution.includes("1920") ? "1080p" : project.resolution.includes("3840") ? "4K" : project.resolution.includes("1280") ? "720p" : project.resolution.split("x")[1] + "p"}
            </div>
          )}

          {/* Hover play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(124,106,255,0.9)", boxShadow: "0 4px 24px rgba(124,106,255,0.5)" }}
            >
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[13px] font-semibold text-white/85 truncate leading-tight">{project.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-white/25 font-medium">{formatTimeAgo(project.lastModified)}</span>
            {project.fileSize > 0 && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-[10px] text-white/25 font-medium">{formatFileSize(project.fileSize)}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Context menu trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
        className="absolute top-2 right-2 p-1.5 rounded-md text-white/30 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-all z-10"
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
            style={{ background: "rgba(16,16,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
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
