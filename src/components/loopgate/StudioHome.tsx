import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Film, Trash2, ChevronLeft, MoreVertical,
  Video, Layers, Import, Scissors, Type, Music,
  Wand2, Zap, Monitor, Smartphone, Ratio, Keyboard,
  ExternalLink, Bug, Sparkles
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ActiveSoloBanner from "./ActiveSoloBanner";
import StudioSubmitHub from "./StudioSubmitHub";

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

const QUICK_TOOLS = [
  { icon: Scissors, label: "Trim & Cut", desc: "Split, trim, remove sections" },
  { icon: Wand2, label: "24+ Filters", desc: "Color grade your footage" },
  { icon: Type, label: "Text & Titles", desc: "50+ fonts, 12 animations" },
  { icon: Music, label: "Transitions", desc: "12 professional presets" },
];

const SHORTCUTS_DESKTOP = [
  { keys: "Space", action: "Play / Pause" },
  { keys: "⌘Z", action: "Undo" },
  { keys: "⌘S", action: "Export" },
  { keys: "C", action: "Split clip" },
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
      {/* ═══ SUBMISSION HUB — TOP OF TOP ═══ */}
      <div className={`${isMobile ? "px-3 pt-3" : "max-w-6xl mx-auto px-8 pt-4"}`}>
        <StudioSubmitHub />
      </div>

      {/* ═══ HEADER BAR ═══ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06]"
        style={{ background: "linear-gradient(180deg, rgba(10,10,14,0.98) 0%, rgba(10,10,14,0.95) 100%)", backdropFilter: "blur(12px)" }}
      >
        <div className={`flex items-center justify-between ${isMobile ? "px-4 py-3" : "max-w-6xl mx-auto px-8 py-3"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/hub")}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white/50" />
            </button>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #7B7BFF)` }}
              >
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-white text-[15px] tracking-tight">Studio</span>
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded"
                style={{ color: ACCENT, background: "rgba(153,153,255,0.08)", border: "1px solid rgba(153,153,255,0.12)" }}
              >
                NLE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <div className="flex items-center gap-1 mr-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Monitor className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] text-white/30 font-medium">Desktop</span>
                </div>
              </div>
            )}
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #7B7BFF)`, boxShadow: "0 2px 12px rgba(153,153,255,0.3)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              {isMobile ? "New" : "New Project"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className={`${isMobile ? "px-4 py-5" : "max-w-6xl mx-auto px-8 py-8"}`}>

        {/* ═══ ACTIVE SOLO BANNER ═══ */}
        <div className="mb-6">
          <ActiveSoloBanner />
        </div>

        {/* ═══ HERO IMPORT AREA ═══ */}
        <motion.button
          onClick={onNewProject}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.003 }}
          className={`w-full rounded-xl overflow-hidden relative group ${isMobile ? "py-10" : "py-14"}`}
          style={{
            background: "linear-gradient(135deg, rgba(153,153,255,0.06) 0%, rgba(20,20,28,0.8) 50%, rgba(153,153,255,0.04) 100%)",
            border: "1px solid rgba(153,153,255,0.1)",
          }}
        >
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(153,153,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(153,153,255,0.6) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: `radial-gradient(circle, rgba(153,153,255,0.1), transparent 70%)` }}
          />

          <div className="relative flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #7B7BFF)`, boxShadow: "0 8px 32px rgba(153,153,255,0.25)" }}
              >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
                <Import className="w-2.5 h-2.5 text-white/70" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-[15px] tracking-tight">Import Video</p>
              <p className="text-[11px] text-white/35 mt-0.5">Drag & drop or click to browse</p>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              {["MP4", "MOV", "WEBM"].map(fmt => (
                <span key={fmt} className="text-[9px] font-mono font-medium tracking-wider px-2 py-0.5 rounded"
                  style={{ color: "rgba(153,153,255,0.5)", background: "rgba(153,153,255,0.05)", border: "1px solid rgba(153,153,255,0.08)" }}
                >
                  {fmt}
                </span>
              ))}
              <span className="text-[9px] text-white/15 font-medium">up to 2GB</span>
            </div>
          </div>
        </motion.button>

        {/* ═══ EDITOR ALTERNATIVES ═══ */}
        <div className="mt-6 rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">Pro Editors</h3>
          </div>
          <p className="text-[11px] text-white/30 mb-3">
            Our built-in editor is experimental — use these industry tools for your best work 🔥
          </p>
          
          <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
            {[
              { name: "CapCut", url: "https://www.capcut.com", desc: "Free, mobile + desktop", color: "#00E5FF" },
              { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", desc: "Pro-grade, free tier", color: "#FF6B35" },
              { name: "Premiere Pro", url: "https://www.adobe.com/products/premiere.html", desc: "Industry standard", color: "#9999FF" },
              { name: "After Effects", url: "https://www.adobe.com/products/aftereffects.html", desc: "Motion & VFX", color: "#CF96FD" },
            ].map(editor => (
              <a
                key={editor.name}
                href={editor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:scale-[1.02] group/link"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${editor.color}15`, border: `1px solid ${editor.color}20` }}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: editor.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-white/70 group-hover/link:text-white/90 transition-colors">{editor.name}</p>
                  <p className="text-[9px] text-white/25 truncate">{editor.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Bug report note */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,180,0,0.04)", border: "1px solid rgba(255,180,0,0.08)" }}
          >
            <Bug className="w-3.5 h-3.5 text-yellow-500/60 flex-shrink-0" />
            <p className="text-[10px] text-white/35">
              Found a bug in our editor? <span className="text-yellow-500/60 font-medium">Report it in your Unit chat or DMs</span> — we're actively improving it
            </p>
          </div>
        </div>

        {/* ═══ RECENT PROJECTS ═══ */}
        {recentProjects.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">
                  Recent
                </h2>
              </div>
              <span className="text-[10px] text-white/20 font-medium">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
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

        {/* ═══ OLDER PROJECTS ═══ */}
        {olderProjects.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em]">Older</h2>
            <div className="space-y-1">
              {olderProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-white/[0.03]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="w-14 h-9 rounded flex-shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
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

        {/* ═══ EMPTY STATE — TOOLKIT + SHORTCUTS ═══ */}
        {projects.length === 0 && (
          <div className={`mt-8 ${isMobile ? "space-y-6" : "grid grid-cols-2 gap-6"}`}>
            {/* Toolkit */}
            <div className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">Toolkit</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_TOOLS.map(tool => (
                  <div key={tool.label} className="flex items-start gap-2.5 p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(153,153,255,0.08)" }}
                    >
                      <tool.icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white/70">{tool.label}</p>
                      <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shortcuts / Info */}
            <div className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">
                  {isMobile ? "Features" : "Shortcuts"}
                </h3>
              </div>

              {isMobile ? (
                <div className="space-y-3">
                  {[
                    { label: "Touch-optimized", desc: "Designed for mobile editing" },
                    { label: "Real-time preview", desc: "See changes instantly" },
                    { label: "Export as MP4", desc: "H.264 codec, share anywhere" },
                    { label: "4K Upscaler", desc: "2x and 4x resolution boost" },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-3 py-1.5">
                      <div className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />
                      <div>
                        <p className="text-[12px] font-medium text-white/60">{f.label}</p>
                        <p className="text-[10px] text-white/25">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {SHORTCUTS_DESKTOP.map(s => (
                    <div key={s.keys} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                      <span className="text-[12px] text-white/40">{s.action}</span>
                      <kbd className="text-[11px] font-mono font-medium px-2 py-0.5 rounded text-white/50"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {s.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              )}

              {/* Aspect ratio presets */}
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider mb-2.5">Aspect Ratios</p>
                <div className="flex items-center gap-2">
                  {[
                    { icon: Smartphone, label: "9:16" },
                    { icon: Ratio, label: "1:1" },
                    { icon: Monitor, label: "16:9" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <r.icon className="w-3 h-3 text-white/25" />
                      <span className="text-[10px] font-mono text-white/35">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom breathing room */}
        <div className="h-12" />
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative"
    >
      <button
        onClick={() => onOpen(project)}
        className="w-full text-left rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02]"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,153,255,0.25)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(153,153,255,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <div className="aspect-video bg-black relative overflow-hidden">
          {project.thumbnail ? (
            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(153,153,255,0.05), rgba(153,153,255,0.02))" }}>
              <Video className="w-6 h-6 text-white/15" />
            </div>
          )}
          {project.duration > 0 && (
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white/80"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            >
              {formatDuration(project.duration)}
            </div>
          )}
          {project.resolution && (
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-medium tracking-wider"
              style={{ color: ACCENT, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            >
              {project.resolution.includes("1920") ? "1080p" : project.resolution.includes("3840") ? "4K" : project.resolution.split("x")[1] + "p"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(153,153,255,0.9)", boxShadow: "0 4px 20px rgba(153,153,255,0.4)" }}
            >
              <Film className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-[13px] font-medium text-white/90 truncate">{project.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-white/30 font-medium">{formatTimeAgo(project.lastModified)}</span>
            {project.fileSize > 0 && (
              <>
                <span className="text-[10px] text-white/10">·</span>
                <span className="text-[10px] text-white/30 font-medium">{formatFileSize(project.fileSize)}</span>
              </>
            )}
          </div>
        </div>
      </button>

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
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/[0.04] w-full transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
