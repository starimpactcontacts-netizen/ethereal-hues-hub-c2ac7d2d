import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Settings, Shield, Crown, Users, Star, Zap, Share2, LogOut,
  Hash, Megaphone, BookOpen, Lock, ChevronRight, Trophy, Plus, MessageCircle,
  DollarSign, Eye, UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useCrewChannels, useChannelMessages, CrewChannel } from "@/hooks/useCrewChannels";
import { useChannelPresence } from "@/hooks/useChannelPresence";
import { useChannelUnread } from "@/hooks/useChannelUnread";
import { useCrewEditorSystem } from "@/hooks/useCrewEditorSystem";
import { useCrewPresence } from "@/hooks/useCrewPresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewInviteModal from "@/components/loopgate/CrewInviteModal";
import ChannelChatView from "@/components/loopgate/ChannelChatView";
import ChannelMembersList from "@/components/loopgate/ChannelMembersList";
import ChannelSettingsPage from "@/components/loopgate/ChannelSettingsPage";
import CrewLevelBadge from "@/components/loopgate/CrewLevelBadge";
import HostEarningsDashboard from "@/components/loopgate/HostEarningsDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  min_league: "open" | "pro" | "elite";
  join_type: string;
  member_count: number;
  max_members: number | null;
  owner_id: string;
  avatar_url: string | null;
  discord_url: string | null;
  is_featured: boolean;
  banner_url: string | null;
  banner_color: string | null;
  bot_name: string | null;
  bot_avatar_url: string | null;
}

interface Member {
  user_id: string;
  role: "owner" | "officer" | "member";
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    league?: string;
    xp?: number;
    level?: number;
    global_index_score?: number;
  } | null;
}

function calculateCrewLevel(xp: number): number {
  if (xp >= 70000) return 10;
  if (xp >= 45000) return 9;
  if (xp >= 32000) return 8;
  if (xp >= 22000) return 7;
  if (xp >= 15000) return 6;
  if (xp >= 10000) return 5;
  if (xp >= 6000) return 4;
  if (xp >= 3000) return 3;
  if (xp >= 1000) return 2;
  return 1;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  text: <Hash className="w-4 h-4 text-muted-foreground/60" />,
  announcement: <Megaphone className="w-4 h-4 text-muted-foreground/60" />,
  rules: <BookOpen className="w-4 h-4 text-muted-foreground/60" />,
};

const teko = { fontFamily: 'Teko, sans-serif' };

// Discord-style collapsible channel category
function ChannelCategory({
  category,
  channels,
  activeChannelId,
  unreadCounts,
  onSelectChannel,
  isStaff,
  onAddChannel,
}: {
  category: string;
  channels: CrewChannel[];
  activeChannelId: string | null;
  unreadCounts: Record<string, number>;
  onSelectChannel: (id: string) => void;
  isStaff?: boolean;
  onAddChannel?: (category: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const totalUnread = channels.reduce((sum, ch) => sum + (unreadCounts[ch.id] || 0), 0);

  return (
    <div className="mt-1">
      <div className="flex items-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-1 flex items-center gap-0.5 px-2 py-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronRight className={cn("w-3 h-3 transition-transform duration-150", !collapsed && "rotate-90")} />
          <span className="flex-1 text-left">{category}</span>
          {collapsed && totalUnread > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {totalUnread}
            </span>
          )}
        </button>
        {isStaff && onAddChannel && (
          <button
            onClick={() => onAddChannel(category)}
            className="p-1 mr-1 rounded hover:bg-muted/30 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            title="Add channel"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden"
          >
            {channels
              .sort((a, b) => (a.channel_order ?? 0) - (b.channel_order ?? 0))
              .map((channel) => {
                const unread = unreadCounts[channel.id] || 0;
                const icon = CHANNEL_ICONS[channel.channel_type] || CHANNEL_ICONS.text;
                const isActive = channel.id === activeChannelId;

                return (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md transition-colors",
                      isActive
                        ? "bg-muted/40 text-foreground"
                        : unread > 0
                          ? "text-foreground"
                          : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    <span className="shrink-0">{icon}</span>
                    <span className={cn("flex-1 text-left text-[13px] truncate", unread > 0 && !isActive && "font-semibold text-foreground")}>
                      {channel.name}
                    </span>
                    {channel.is_locked && <Lock className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                    {unread > 0 && !isActive && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Create channel dialog
function CreateChannelDialog({
  open,
  onOpenChange,
  defaultCategory,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: string;
  onSubmit: (name: string, category: string, type: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [type, setType] = useState("text");

  useEffect(() => {
    if (open) {
      setName("");
      setCategory(defaultCategory);
      setType("text");
    }
  }, [open, defaultCategory]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onSubmit(slug, category, type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>Add a new channel to your unit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Channel Name</label>
            <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3">
              <Hash className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <Input
                placeholder="new-channel"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                className="bg-transparent border-0 focus-visible:ring-0 text-sm h-9"
                maxLength={32}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
            <Input
              placeholder="General"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm h-9"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text"><div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Text</div></SelectItem>
                <SelectItem value="announcement"><div className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5" /> Announcement</div></SelectItem>
                <SelectItem value="rules"><div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Rules</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full" size="sm">
            Create Channel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tournament earnings display for owners
function TournamentEarnings({ crewId }: { crewId: string }) {
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalViews: 0, totalParticipants: 0, compCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data } = await (supabase as any)
        .from("hosted_competitions")
        .select("id, view_count, participant_count, host_earnings_cents, status")
        .eq("crew_id", crewId);

      if (data && Array.isArray(data)) {
        const results = data as any[];
        const totalEarnings = results.reduce((s: number, c: any) => s + (c.host_earnings_cents || 0), 0);
        const totalViews = results.reduce((s: number, c: any) => s + (c.view_count || 0), 0);
        const totalParticipants = results.reduce((s: number, c: any) => s + (c.participant_count || 0), 0);
        setEarnings({ totalEarnings, totalViews, totalParticipants, compCount: results.length });
      }
      setLoading(false);
    };
    fetchEarnings();
  }, [crewId]);

  if (loading || earnings.compCount === 0) return null;

  return (
    <div className="mx-3 mb-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        <DollarSign className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tournament Revenue</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-black text-emerald-400">${(earnings.totalEarnings / 100).toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground/50">Earned</p>
        </div>
        <div>
          <p className="text-sm font-black text-foreground/70">{earnings.totalViews.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground/50">Views</p>
        </div>
        <div>
          <p className="text-sm font-black text-foreground/70">{earnings.totalParticipants}</p>
          <p className="text-[9px] text-muted-foreground/50">Competitors</p>
        </div>
      </div>
    </div>
  );
}

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isDev } = useUserRoles(user?.id);

  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [mobileView, setMobileView] = useState<"channels" | "chat">("channels");
  const [permissionsChannel, setPermissionsChannel] = useState<CrewChannel | null>(null);
  const [crewLevel, setCrewLevel] = useState(1);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [createChannelCategory, setCreateChannelCategory] = useState("General");

  const isMobile = useIsMobile();
  const activeChannelId = searchParams.get("channel");

  const { channels, channelsByCategory, loading: channelsLoading, createChannel, updateChannel, deleteChannel, refresh: refreshChannels } = useCrewChannels(crewId);
  const { unreadCounts, markChannelAsRead } = useChannelUnread(crewId);
  const { tiers } = useCrewEditorSystem(crewId || "");
  const { onlineCount } = useCrewPresence(crewId);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const { messages, sendMessage, loading: messagesLoading } = useChannelMessages(activeChannel?.id);
  const { onlineMembers, typingUsers, broadcastTyping } = useChannelPresence(crewId, activeChannel?.id);

  // Fetch crew and members
  useEffect(() => {
    if (!crewId) return;
    const fetchCrewData = async () => {
      setLoading(true);
      const [crewResult, membersResult] = await Promise.all([
        supabase.from("crews").select("*").eq("id", crewId).single(),
        supabase.from("crew_members").select("user_id, role").eq("crew_id", crewId),
      ]);

      if (crewResult.error || !crewResult.data) {
        navigate("/units");
        return;
      }
      setCrew(crewResult.data as Crew);

      const membersData = membersResult.data || [];
      if (membersData.length > 0) {
        const memberIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, league, xp, level, global_index_score")
          .in("id", memberIds);

        const membersWithProfiles = membersData.map((member) => ({
          ...member,
          role: member.role as "owner" | "officer" | "member",
          profile: profiles?.find((p) => p.id === member.user_id) || null,
        }));
        setMembers(membersWithProfiles);

        const totalXP = profiles?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;
        setCrewLevel(calculateCrewLevel(totalXP));

        if (user) {
          const myMembership = membersData.find((m) => m.user_id === user.id);
          setMyRole(myMembership?.role as "owner" | "officer" | "member" | null);
        }
      }
      setLoading(false);
    };
    fetchCrewData();
  }, [crewId, user, navigate]);

  // Set default channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const generalChannel = channels.find((c) => c.name === "general") || channels[0];
      setSearchParams({ channel: generalChannel.id }, { replace: true });
    }
  }, [channels, activeChannelId, setSearchParams]);

  const handleSelectChannel = useCallback((channelId: string) => {
    setSearchParams({ channel: channelId });
    if (isMobile) setMobileView("chat");
  }, [setSearchParams, isMobile]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!crewId) return null;
    return sendMessage(crewId, text);
  }, [crewId, sendMessage]);

  const handleMarkAsRead = useCallback(() => {
    if (activeChannel?.id) markChannelAsRead(activeChannel.id);
  }, [activeChannel?.id, markChannelAsRead]);

  const handleSavePermissions = useCallback(async (channelId: string, updates: Partial<CrewChannel>) => {
    return updateChannel(channelId, updates);
  }, [updateChannel]);

  const handleSaveBotSettings = useCallback(async (name: string, avatarUrl: string) => {
    if (!crewId) return;
    const { error } = await supabase
      .from("crews")
      .update({ bot_name: name, bot_avatar_url: avatarUrl || null })
      .eq("id", crewId);
    if (!error) {
      setCrew((prev) => prev ? { ...prev, bot_name: name, bot_avatar_url: avatarUrl || null } : prev);
    }
  }, [crewId]);

  const handleLeaveCrew = async () => {
    if (!user || !crewId) return;
    await supabase.from("crew_members").delete().eq("crew_id", crewId).eq("user_id", user.id);
    navigate("/units");
  };

  const handleJoinCrew = async () => {
    if (!user || !crewId || !crew) return;
    if (crew.max_members && crew.member_count >= crew.max_members) {
      toast.error("This unit is full.");
      return;
    }
    if (crew.join_type === "invite_only") {
      const { error } = await supabase.from("crew_join_requests").insert({ crew_id: crewId, user_id: user.id });
      if (error?.code === "23505") toast.error("Request already pending.");
      else if (error) toast.error("Failed to send request");
      else toast.success("Join request sent!");
    } else {
      const { error } = await supabase.from("crew_members").insert({ crew_id: crewId, user_id: user.id, role: "member" });
      if (error) toast.error("Failed to join");
      else {
        toast.success(`Welcome to ${crew.name}!`);
        window.location.reload();
      }
    }
  };

  const handleCreateChannel = useCallback(async (name: string, category: string, type: string) => {
    await createChannel({
      name,
      category,
      channel_type: type as "text" | "announcement" | "rules",
      category_order: Object.keys(channelsByCategory).indexOf(category) >= 0 
        ? (channelsByCategory[category]?.[0]?.category_order ?? 0) 
        : Object.keys(channelsByCategory).length,
    });
  }, [createChannel, channelsByCategory]);

  const handleAddChannelToCategory = useCallback((category: string) => {
    setCreateChannelCategory(category);
    setShowCreateChannel(true);
  }, []);

  if (loading || channelsLoading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const isOwner = crew.owner_id === user?.id || myRole === "owner";
  const isStaff = isOwner || myRole === "officer";
  const canAccessSettings = isOwner || isAdmin || isDev;
  const isMember = !!myRole;

  // ━━━ SIDEBAR CONTENT ━━━
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Unit Identity Header */}
      <div className="shrink-0 border-b border-border/30">
        <div className="h-20 relative overflow-hidden">
          {crew.banner_url ? (
            <img src={crew.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted/20 via-muted/5 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        </div>

        <div className="px-3 pb-3 -mt-6 relative z-10">
          <div className="flex items-end gap-2.5 mb-2">
            <div className="w-11 h-11 rounded-lg bg-card border-2 border-card overflow-hidden shrink-0 shadow-lg">
              {crew.avatar_url ? (
                <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black uppercase tracking-wide leading-none truncate" style={teko}>
                  {crew.name}
                </h2>
                {crew.is_featured && <Star className="w-3 h-3 text-primary fill-primary shrink-0" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <CrewLevelBadge level={crewLevel} size="xs" />
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="text-foreground/60 font-semibold">{members.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-semibold">{onlineCount}</span>
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 mt-2">
            {isMember && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Invite"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {canAccessSettings && (
              <button
                onClick={() => navigate(`/units/${crewId}/settings`)}
                className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            
            <div className="flex-1" />
            {isMember && myRole !== "owner" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-colors" title="Leave">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave {crew.name}?</AlertDialogTitle>
                    <AlertDialogDescription>You can rejoin anytime if the unit is open.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveCrew}>Leave</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Earnings for owners */}
      {isOwner && crewId && <TournamentEarnings crewId={crewId} />}
      
      {/* Full Earnings Dashboard (expandable) */}
      {isOwner && crewId && showEarnings && (
        <div className="mx-3 mb-2">
          <HostEarningsDashboard crewId={crewId} />
        </div>
      )}
      {isOwner && crewId && (
        <button
          onClick={() => setShowEarnings(!showEarnings)}
          className="mx-3 mb-2 w-[calc(100%-24px)] py-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
        >
          {showEarnings ? "Hide Details" : "View Full Earnings Dashboard →"}
        </button>
      )}

      {/* ━━━ OWNER ACTION BUTTONS ━━━ */}
      {isOwner && crewId && (
        <div className="mx-3 mb-3 space-y-2">
          {/* Free Tournament - The Red Button */}
          <button
            onClick={() => navigate(`/units/${crewId}/host-tournament`)}
            className="w-full group relative overflow-hidden rounded-lg p-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, hsl(0 72% 51%), hsl(350 80% 40%))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black uppercase tracking-wide text-white leading-none" style={teko}>
                  Host Tournament
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">Free competition · Build hype</p>
              </div>
              <Zap className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
            </div>
          </button>

          {/* Monetized Tournament */}
          <button
            onClick={() => navigate(`/units/${crewId}/host-tournament?monetize=true`)}
            className="w-full group relative overflow-hidden rounded-lg p-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 25%))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black uppercase tracking-wide text-white leading-none" style={teko}>
                  Monetize Tournament
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">Earn from views & competitors</p>
              </div>
              <DollarSign className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
            </div>
          </button>
        </div>
      )}

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-1 overscroll-contain">
        {isMember ? (
          <>
            {Object.entries(channelsByCategory)
              .sort(([, a], [, b]) => {
                const aOrder = a[0]?.category_order ?? 99;
                const bOrder = b[0]?.category_order ?? 99;
                return aOrder - bOrder;
              })
              .map(([category, categoryChannels]) => (
                <ChannelCategory
                  key={category}
                  category={category}
                  channels={categoryChannels}
                  activeChannelId={activeChannelId}
                  unreadCounts={unreadCounts}
                  onSelectChannel={handleSelectChannel}
                  isStaff={isStaff}
                  onAddChannel={handleAddChannelToCategory}
                />
              ))}
            {/* Add category button for staff */}
            {isStaff && (
              <button
                onClick={() => {
                  setCreateChannelCategory("");
                  setShowCreateChannel(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Channel</span>
              </button>
            )}
          </>
        ) : (
          <div className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {crew.description || "A competitive editing unit on Loopgate."}
            </p>
            
            {user ? (
              <Button
                onClick={handleJoinCrew}
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold text-sm"
              >
                {crew.join_type === "invite_only" ? "Request to Join" : "Join Unit"}
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="w-full" variant="outline">
                Sign in to join
              </Button>
            )}

            <div className="space-y-0.5 opacity-50">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 px-1 mb-1">Channels</p>
              {channels.slice(0, 6).map((ch) => (
                <div key={ch.id} className="flex items-center gap-2 px-2 py-1 text-muted-foreground/40 text-[13px]">
                  {CHANNEL_ICONS[ch.channel_type] || CHANNEL_ICONS.text}
                  <span>{ch.name}</span>
                  <Lock className="w-3 h-3 ml-auto" />
                </div>
              ))}
              {channels.length > 6 && (
                <p className="text-[10px] text-muted-foreground/30 px-2">+{channels.length - 6} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ━━━ MOBILE LAYOUT ━━━
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-background flex flex-col z-50"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mobileView === "channels" ? (
            <motion.div
              key="channels"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              exit={{ x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Top bar */}
              <div className="bg-card/95 backdrop-blur-md border-b border-border/30 shrink-0 px-3 py-2.5 flex items-center gap-2.5">
                <button
                  onClick={() => navigate("/units")}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-[15px] truncate" style={teko}>{crew.name}</h2>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{onlineCount}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <SidebarContent />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              exit={{ x: 20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {activeChannel && isMember && (
                <ChannelChatView
                  channel={activeChannel}
                  crewId={crewId!}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                  typingUsers={typingUsers}
                  onTyping={broadcastTyping}
                  isOfficer={isStaff}
                  crewName={crew.name}
                  botName={crew.bot_name || undefined}
                  botAvatarUrl={crew.bot_avatar_url || undefined}
                  showBackOnMobile={true}
                  onBack={() => setMobileView("channels")}
                  onShowPermissions={
                    isStaff && activeChannel ? () => setPermissionsChannel(activeChannel) : undefined
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {permissionsChannel && (
            <ChannelSettingsPage
              channel={permissionsChannel}
              crewId={crewId!}
              isOpen={!!permissionsChannel}
              onClose={() => setPermissionsChannel(null)}
              onSave={handleSavePermissions}
              tiers={tiers}
              botName={crew.bot_name || "Unit Bot"}
              botAvatarUrl={crew.bot_avatar_url || ""}
              onSaveBotSettings={handleSaveBotSettings}
            />
          )}
        </AnimatePresence>

        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          defaultCategory={createChannelCategory}
          onSubmit={handleCreateChannel}
        />

        {crew && (
          <CrewInviteModal
            open={showInviteModal}
            onOpenChange={setShowInviteModal}
            crewName={crew.name}
            crewId={crew.id}
          />
        )}
      </div>
    );
  }

  // ━━━ DESKTOP LAYOUT — Discord style ━━━
  return (
    <div
      className="fixed inset-0 bg-background flex z-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Sidebar */}
      <div className="w-60 border-r border-border/20 flex flex-col shrink-0">
        <div className="px-3 py-2 border-b border-border/20 flex items-center gap-2">
          <button onClick={() => navigate("/units")} className="p-1 rounded hover:bg-muted/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/30 font-semibold">Back to Units</span>
        </div>
        <SidebarContent />
      </div>

      {/* Main Chat Area */}
      {isMember && activeChannel ? (
        <ChannelChatView
          channel={activeChannel}
          crewId={crewId!}
          messages={messages}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          typingUsers={typingUsers}
          onTyping={broadcastTyping}
          isOfficer={isStaff}
          crewName={crew.name}
          botName={crew.bot_name || undefined}
          botAvatarUrl={crew.bot_avatar_url || undefined}
          onShowMembers={() => setShowMembers(!showMembers)}
          onShowPermissions={
            isStaff && activeChannel ? () => setPermissionsChannel(activeChannel) : undefined
          }
        />
      ) : !isMember ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-xl bg-muted/20 overflow-hidden mb-5 shadow-lg">
            {crew.avatar_url ? (
              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wide mb-2" style={teko}>{crew.name}</h1>
          <p className="text-sm text-muted-foreground/60 max-w-md mb-6 leading-relaxed">
            {crew.description || "A competitive editing unit."}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/40 mb-8">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {members.length} members</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {onlineCount} online</span>
          </div>
          {user ? (
            <Button onClick={handleJoinCrew} className="bg-foreground text-background hover:bg-foreground/90 font-bold px-8 h-11 text-sm">
              {crew.join_type === "invite_only" ? "Request to Join" : "Join Unit"}
            </Button>
          ) : (
            <Button onClick={() => navigate("/auth")} variant="outline" className="px-8 h-11">
              Sign in to join
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a channel</p>
        </div>
      )}

      {/* Members Panel */}
      <AnimatePresence>
        {showMembers && isMember && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 224 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ChannelMembersList members={members} onlineMembers={onlineMembers} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel Settings */}
      <AnimatePresence>
        {permissionsChannel && (
          <ChannelSettingsPage
            channel={permissionsChannel}
            crewId={crewId!}
            isOpen={!!permissionsChannel}
            onClose={() => setPermissionsChannel(null)}
            onSave={handleSavePermissions}
            tiers={tiers}
            botName={crew.bot_name || "Unit Bot"}
            botAvatarUrl={crew.bot_avatar_url || ""}
            onSaveBotSettings={handleSaveBotSettings}
          />
        )}
      </AnimatePresence>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        defaultCategory={createChannelCategory}
        onSubmit={handleCreateChannel}
      />

      {/* Invite Modal */}
      {crew && (
        <CrewInviteModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          crewName={crew.name}
          crewId={crew.id}
        />
      )}
    </div>
  );
}
