import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Trash2, Pin, Calendar, Trophy, Users, Megaphone, Image, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface UnitAnnouncementsTabProps {
  crewId: string;
  isStaff: boolean;
}

type AnnouncementCategory = "event" | "update" | "recruitment" | "win";

interface Announcement {
  id: string;
  crew_id: string;
  author_id: string;
  message: string;
  category: AnnouncementCategory;
  thumbnail_url: string | null;
  is_pinned: boolean;
  created_at: string;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const CATEGORIES: { id: AnnouncementCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "update", label: "Update", icon: <Megaphone className="w-3.5 h-3.5" />, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { id: "event", label: "Event", icon: <Calendar className="w-3.5 h-3.5" />, color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { id: "recruitment", label: "Recruitment", icon: <Users className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  { id: "win", label: "Win", icon: <Trophy className="w-3.5 h-3.5" />, color: "text-gold bg-gold/10 border-gold/30" },
];

export default function UnitAnnouncementsTab({ crewId, isStaff }: UnitAnnouncementsTabProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("update");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterCategory, setFilterCategory] = useState<AnnouncementCategory | "all">("all");

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from("crew_announcements")
      .select("*")
      .eq("crew_id", crewId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching announcements:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map((a) => a.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", authorIds);

      setAnnouncements(
        data.map((a) => ({
          ...a,
          category: (a.category || "update") as AnnouncementCategory,
          author: profiles?.find((p) => p.id === a.author_id),
        }))
      );
    } else {
      setAnnouncements([]);
    }
    setLoading(false);
  }, [crewId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Mark as read
  useEffect(() => {
    if (!user) return;
    supabase
      .from("crew_announcement_reads")
      .upsert({ user_id: user.id, crew_id: crewId, last_read_at: new Date().toISOString() }, { onConflict: "user_id,crew_id" });
  }, [crewId, user]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`announcements-v2-${crewId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crew_announcements", filter: `crew_id=eq.${crewId}` }, () => {
        fetchAnnouncements();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [crewId, fetchAnnouncements]);

  const handlePost = async () => {
    if (!user || !message.trim()) return;
    setSending(true);

    const { error } = await supabase.from("crew_announcements").insert({
      crew_id: crewId,
      author_id: user.id,
      message: message.trim(),
      category,
      thumbnail_url: thumbnailUrl || null,
    });

    if (error) {
      toast.error("Failed to post announcement");
    } else {
      setMessage("");
      setThumbnailUrl("");
      setShowComposer(false);
      toast.success("Announcement posted!");
    }
    setSending(false);
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    const { error } = await supabase
      .from("crew_announcements")
      .update({ is_pinned: !currentlyPinned })
      .eq("id", id);

    if (error) toast.error("Failed to update pin");
    else fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("crew_announcements").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else fetchAnnouncements();
  };

  const filtered = filterCategory === "all"
    ? announcements
    : announcements.filter((a) => a.category === filterCategory);

  const getCategoryMeta = (cat: AnnouncementCategory) =>
    CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Announcements</h3>
        {isStaff && (
          <Button size="sm" onClick={() => setShowComposer(!showComposer)} className="gap-1.5">
            <Megaphone className="w-4 h-4" />
            Post
          </Button>
        )}
      </div>

      {/* Composer */}
      <AnimatePresence>
        {showComposer && isStaff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">
              {/* Category Selector */}
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      category === cat.id ? cat.color : "text-muted-foreground bg-muted/20 border-border"
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement..."
                className="min-h-[80px] resize-none bg-background"
              />

              {/* Thumbnail URL */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Image className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Thumbnail URL (optional)"
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
                  />
                </div>
              </div>

              {thumbnailUrl && (
                <div className="relative w-full max-h-40 rounded-lg overflow-hidden bg-muted">
                  <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover max-h-40" />
                  <button onClick={() => setThumbnailUrl("")} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowComposer(false)} className="flex-1">Cancel</Button>
                <Button onClick={handlePost} disabled={sending || !message.trim()} className="flex-1 bg-gold text-black hover:bg-gold/90">
                  {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" />Post</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
            filterCategory === "all" ? "text-foreground bg-foreground/10 border-foreground/30" : "text-muted-foreground bg-muted/20 border-border"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
              filterCategory === cat.id ? cat.color : "text-muted-foreground bg-muted/20 border-border"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((a, i) => {
            const catMeta = getCategoryMeta(a.category);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-card border rounded-xl overflow-hidden ${a.is_pinned ? "border-gold/40" : "border-border/50"}`}
              >
                {/* Pinned indicator */}
                {a.is_pinned && (
                  <div className="px-3 py-1 bg-gold/10 border-b border-gold/20 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">Pinned</span>
                  </div>
                )}

                {/* Thumbnail */}
                {a.thumbnail_url && (
                  <div className="w-full h-40 bg-muted">
                    <img src={a.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={a.author?.avatar_url || ""} />
                      <AvatarFallback>{(a.author?.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{a.author?.display_name || a.author?.username || "Staff"}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 ${catMeta.color}`}>
                          {catMeta.icon}
                          {catMeta.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.message}</p>
                    </div>
                  </div>

                  {/* Staff actions */}
                  {isStaff && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 text-xs gap-1 ${a.is_pinned ? "text-gold" : "text-muted-foreground"}`}
                        onClick={() => handleTogglePin(a.id, a.is_pinned)}
                      >
                        <Pin className="w-3 h-3" />
                        {a.is_pinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive gap-1"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="font-medium text-sm text-muted-foreground">No Announcements</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {isStaff ? "Post an announcement to keep the unit updated." : "Check back later for updates."}
          </p>
        </div>
      )}
    </div>
  );
}
