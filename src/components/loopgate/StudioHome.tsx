import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Film, Trash2, ChevronLeft, MoreVertical,
  Smartphone, Monitor, Square, FileVideo, Sparkles
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
  // Keep max 20
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
    <div className="min-h-screen bg-background">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hub")}
            className="p-2 rounded-lg hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground text-lg">Studio</span>
          </div>
        </div>
      </div>

      <div className={`${isMobile ? "px-4 py-5" : "max-w-5xl mx-auto px-8 py-10"} space-y-8`}>
        {/* ═══ NEW PROJECT CTA ═══ */}
        <motion.button
          onClick={onNewProject}
          whileTap={{ scale: 0.97 }}
          className={`w-full rounded-2xl border-2 border-dashed transition-all group
            ${isMobile ? "py-10" : "py-16"}
          `}
          style={{
            borderColor: "rgba(153,153,255,0.3)",
            background: "rgba(153,153,255,0.04)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: ACCENT }}
            >
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">New Project</p>
              <p className="text-xs text-muted-foreground mt-0.5">Import a video to start editing</p>
            </div>
          </div>
        </motion.button>

        {/* ═══ RECENT PROJECTS ═══ */}
        {recentProjects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Projects
              </h2>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
              {recentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative"
                >
                  <button
                    onClick={() => onOpenProject(project)}
                    className="w-full text-left rounded-xl overflow-hidden border border-border/40 bg-card hover:border-[rgba(153,153,255,0.4)] transition-all hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-muted/40 relative overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {/* Duration badge */}
                      {project.duration > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {formatDuration(project.duration)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimeAgo(project.lastModified)}
                        </span>
                        {project.fileSize > 0 && (
                          <>
                            <span className="text-[10px] text-muted-foreground/40">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatFileSize(project.fileSize)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {contextMenu === project.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-10 right-2 z-20 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted/60 w-full"
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Older
            </h2>
            <div className="space-y-1.5">
              {olderProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 hover:border-[rgba(153,153,255,0.3)] transition-all text-left"
                >
                  <div className="w-12 h-8 rounded bg-muted/40 flex-shrink-0 overflow-hidden">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileVideo className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(project.lastModified)}
                      {project.duration > 0 && ` • ${formatDuration(project.duration)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap "New Project" to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}
