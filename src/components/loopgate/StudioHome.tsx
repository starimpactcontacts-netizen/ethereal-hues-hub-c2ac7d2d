import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Film, Trash2, ChevronLeft, MoreVertical,
  FileVideo, Import, Video, Layers
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ACCENT = "#9999FF";

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

interface StudioHomeProps {
  onNewProject: () => void;
  onOpenProject: (project: StudioProject) => void;
}

export default function StudioHome({ onNewProject, onOpenProject }: StudioHomeProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  useEffect(() => {
    setProjects(getStudioProjects());
  }, []);

  const handleDelete = (id: string) => {
    deleteStudioProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setContextMenu(null);
  };

  const recentProjects = projects.slice(0, 6);
  const olderProjects = projects.slice(6);

  return (
    <div className="min-h-screen bg-black">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
        style={{ background: "linear-gradient(180deg, rgba(153,153,255,0.03) 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hub")}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/50" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #7B7BFF)` }}
            >
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-[15px] tracking-tight">Studio</span>
              <span className="text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded"
                style={{ color: ACCENT, background: "rgba(153,153,255,0.1)", border: "1px solid rgba(153,153,255,0.15)" }}
              >
                NLE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isMobile ? "px-4 py-6" : "max-w-5xl mx-auto px-8 py-10"} space-y-8`}>

        {/* ═══ NEW PROJECT CTA ═══ */}
        <motion.button
          onClick={onNewProject}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.005 }}
          className={`w-full rounded-xl overflow-hidden relative group ${isMobile ? "py-12" : "py-16"}`}
          style={{
            background: "linear-gradient(135deg, rgba(153,153,255,0.08) 0%, rgba(153,153,255,0.02) 50%, rgba(123,123,255,0.06) 100%)",
            border: "1px solid rgba(153,153,255,0.12)",
          }}
        >
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(153,153,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(153,153,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle, rgba(153,153,255,0.15), transparent 70%)` }}
          />

          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #7B7BFF)`,
                  boxShadow: "0 8px 32px rgba(153,153,255,0.25)",
                }}
              >
                <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
                <Import className="w-3 h-3 text-white/70" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-base tracking-tight">New Project</p>
              <p className="text-[11px] text-white/40 mt-1 font-medium">Import a video to start editing</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {["MP4", "MOV", "WEBM"].map(fmt => (
                <span key={fmt} className="text-[9px] font-mono font-medium tracking-wider px-2 py-0.5 rounded"
                  style={{ color: "rgba(153,153,255,0.6)", background: "rgba(153,153,255,0.06)", border: "1px solid rgba(153,153,255,0.08)" }}
                >
                  {fmt}
                </span>
              ))}
              <span className="text-[9px] text-white/20 font-medium">up to 2GB</span>
            </div>
          </div>
        </motion.button>

        {/* ═══ RECENT PROJECTS ═══ */}
        {recentProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">
                  Recent Projects
                </h2>
              </div>
              <span className="text-[10px] text-white/20 font-medium">{projects.length} total</span>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
              {recentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative"
                >
                  <button
                    onClick={() => onOpenProject(project)}
                    className="w-full text-left rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,153,255,0.25)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(153,153,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black relative overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, rgba(153,153,255,0.05), rgba(153,153,255,0.02))" }}
                        >
                          <Video className="w-6 h-6 text-white/15" />
                        </div>
                      )}
                      {/* Duration badge */}
                      {project.duration > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white/80"
                          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
                        >
                          {formatDuration(project.duration)}
                        </div>
                      )}
                      {/* Resolution badge */}
                      {project.resolution && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-medium tracking-wider"
                          style={{ color: ACCENT, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        >
                          {project.resolution.includes("1920") ? "1080p" : project.resolution.includes("3840") ? "4K" : project.resolution.split("x")[1] + "p"}
                        </div>
                      )}
                      {/* Hover play indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(153,153,255,0.9)", boxShadow: "0 4px 20px rgba(153,153,255,0.4)" }}
                        >
                          <Film className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-[13px] font-medium text-white/90 truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-white/30 font-medium">
                          {formatTimeAgo(project.lastModified)}
                        </span>
                        {project.fileSize > 0 && (
                          <>
                            <span className="text-[10px] text-white/10">·</span>
                            <span className="text-[10px] text-white/30 font-medium">
                              {formatFileSize(project.fileSize)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Context menu trigger */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {contextMenu === project.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-10 right-2 z-20 rounded-lg shadow-2xl overflow-hidden"
                        style={{ background: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/[0.04] w-full transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ OLDER PROJECTS ═══ */}
        {olderProjects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em]">
              Older
            </h2>
            <div className="space-y-1">
              {olderProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-white/[0.03]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="w-14 h-9 rounded flex-shrink-0 overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-white/15" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/70 truncate">{project.name}</p>
                    <p className="text-[10px] text-white/25 font-medium">
                      {formatTimeAgo(project.lastModified)}
                      {project.duration > 0 && ` · ${formatDuration(project.duration)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(153,153,255,0.06)", border: "1px solid rgba(153,153,255,0.08)" }}
            >
              <Film className="w-7 h-7" style={{ color: "rgba(153,153,255,0.3)" }} />
            </div>
            <p className="text-sm font-medium text-white/40">No projects yet</p>
            <p className="text-xs text-white/20 mt-1">Import a video to start your first edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
