import { useEffect, useState } from "react";
import { Flame, RefreshCw, Search, Swords } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type QF = {
  id: string;
  player_1_username: string | null;
  player_2_username: string | null;
  player_1_avatar_url: string | null;
  player_2_avatar_url: string | null;
  status: string;
  is_featured: boolean | null;
  created_at: string;
};

export default function QuickFightFeaturedAdmin() {
  const [fights, setFights] = useState<QF[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase.from("quick_fights") as any)
      .select("id, player_1_username, player_2_username, player_1_avatar_url, player_2_avatar_url, status, is_featured, created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) toast.error(error.message);
    setFights((data as QF[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, current: boolean) {
    setBusy(id);
    const { error } = await (supabase.from("quick_fights") as any)
      .update({ is_featured: !current })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(!current ? "Pinned to Hub" : "Unpinned");
      setFights((prev) => prev.map(f => f.id === id ? { ...f, is_featured: !current } : f));
    }
    setBusy(null);
  }

  const filtered = q
    ? fights.filter(f =>
        (f.player_1_username || "").toLowerCase().includes(q.toLowerCase()) ||
        (f.player_2_username || "").toLowerCase().includes(q.toLowerCase()) ||
        f.id.startsWith(q.toLowerCase()))
    : fights;

  return (
    <div className="mb-6 p-4 bg-surface-0 border border-[#FF3B3B]/25 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-[#FF3B3B]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Edit Battles — Feature on Hub</h3>
        </div>
        <button onClick={load} className="p-1.5 hover:bg-white/5 rounded">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Pin live or recent 1v1 edit battles (quick fights) to the Featured Edit Battles rail on the Hub.
      </p>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or fight id" className="pl-8 h-9 text-xs" />
      </div>

      <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="text-center py-6 text-[11px] text-muted-foreground">No edit battles found.</div>
        )}
        {filtered.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => window.open(`/fight/${f.id}`, "_blank", "noopener")}
            className="w-full flex items-center gap-2 p-2 rounded border border-border bg-surface-1 hover:bg-surface-2 hover:border-foreground/20 transition-colors text-left"
          >
            <Avatar className="w-7 h-7 border border-blue-500/40 shrink-0">
              <AvatarImage src={f.player_1_avatar_url || ""} />
              <AvatarFallback className="text-[9px] bg-surface-2">{f.player_1_username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">vs</span>
            <Avatar className="w-7 h-7 border border-red-500/40 shrink-0">
              <AvatarImage src={f.player_2_avatar_url || ""} />
              <AvatarFallback className="text-[9px] bg-surface-2">{f.player_2_username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-foreground truncate">
                {f.player_1_username || "?"} <span className="text-muted-foreground font-normal">vs</span> {f.player_2_username || "Open"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge className="text-[8px] px-1 py-0 h-3.5 uppercase">{f.status}</Badge>
                <span className="text-[9px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggle(f.id, !!f.is_featured); }}
              disabled={busy === f.id}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                f.is_featured
                  ? "bg-[#FF3B3B]/20 border-[#FF3B3B]/50 text-[#FF3B3B]"
                  : "bg-surface-2 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3 h-3" />
              {f.is_featured ? "Featured" : "Feature"}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
