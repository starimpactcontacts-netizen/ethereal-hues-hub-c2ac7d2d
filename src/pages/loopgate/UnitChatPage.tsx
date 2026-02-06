import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Hash, Megaphone, BookOpen, Lock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewChannels, useChannelMessages, CrewChannel } from "@/hooks/useCrewChannels";
import { useChannelPresence } from "@/hooks/useChannelPresence";
import { useChannelUnread } from "@/hooks/useChannelUnread";
import { useCrewEditorSystem } from "@/hooks/useCrewEditorSystem";
import PageTransition from "@/components/loopgate/PageTransition";
import ChannelSidebar from "@/components/loopgate/ChannelSidebar";
import ChannelChatView from "@/components/loopgate/ChannelChatView";
import ChannelMembersList from "@/components/loopgate/ChannelMembersList";
import ChannelSettingsPage from "@/components/loopgate/ChannelSettingsPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Crew {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
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
  } | null;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  text: <Hash className="w-5 h-5 text-muted-foreground/60" />,
  announcement: <Megaphone className="w-5 h-5 text-muted-foreground/60" />,
  rules: <BookOpen className="w-5 h-5 text-muted-foreground/60" />,
};

export default function UnitChatPage() {
  const { crewId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [mobileView, setMobileView] = useState<"channels" | "chat">("channels");
  const [permissionsChannel, setPermissionsChannel] = useState<CrewChannel | null>(null);

  const activeChannelId = searchParams.get("channel");

  const { channels, channelsByCategory, loading: channelsLoading, updateChannel } = useCrewChannels(crewId);
  const { unreadCounts, markChannelAsRead } = useChannelUnread(crewId);
  const { tiers } = useCrewEditorSystem(crewId || "");

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const { messages, sendMessage, loading: messagesLoading } = useChannelMessages(activeChannel?.id);
  const { onlineMembers, typingUsers, broadcastTyping } = useChannelPresence(crewId, activeChannel?.id);

  // Fetch crew and members
  useEffect(() => {
    if (!crewId) return;

    const fetchCrewData = async () => {
      setLoading(true);

      const { data: crewData, error: crewError } = await supabase
        .from("crews")
        .select("id, name, avatar_url, owner_id, bot_name, bot_avatar_url")
        .eq("id", crewId)
        .single();

      if (crewError || !crewData) {
        navigate("/units");
        return;
      }

      setCrew(crewData);

      const { data: membersData } = await supabase
        .from("crew_members")
        .select("user_id, role")
        .eq("crew_id", crewId);

      if (membersData) {
        const memberIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", memberIds);

        const membersWithProfiles = membersData.map((member) => ({
          ...member,
          role: member.role as "owner" | "officer" | "member",
          profile: profiles?.find((p) => p.id === member.user_id) || null,
        }));

        setMembers(membersWithProfiles);

        if (user) {
          const myMembership = membersData.find((m) => m.user_id === user.id);
          setMyRole(myMembership?.role as "owner" | "officer" | "member" | null);
        }
      }

      setLoading(false);
    };

    fetchCrewData();
  }, [crewId, user, navigate]);

  // Set default channel and auto-open chat on mobile
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const generalChannel = channels.find((c) => c.name === "general") || channels[0];
      setSearchParams({ channel: generalChannel.id }, { replace: true });
      // On mobile, auto-open the general channel chat
      if (isMobile) {
        setMobileView("chat");
      }
    }
  }, [channels, activeChannelId, setSearchParams, isMobile]);

  const handleSelectChannel = useCallback(
    (channelId: string) => {
      setSearchParams({ channel: channelId });
      if (isMobile) {
        setMobileView("chat");
      }
    },
    [setSearchParams, isMobile]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!crewId) return null;
      return sendMessage(crewId, text);
    },
    [crewId, sendMessage]
  );

  const handleMarkAsRead = useCallback(() => {
    if (activeChannel?.id) {
      markChannelAsRead(activeChannel.id);
    }
  }, [activeChannel?.id, markChannelAsRead]);

  const handleSavePermissions = useCallback(
    async (channelId: string, updates: Partial<CrewChannel>) => {
      return updateChannel(channelId, updates);
    },
    [updateChannel]
  );

  const handleSaveBotSettings = useCallback(
    async (name: string, avatarUrl: string) => {
      if (!crewId) return;
      const { error } = await supabase
        .from("crews")
        .update({ bot_name: name, bot_avatar_url: avatarUrl || null })
        .eq("id", crewId);
      if (error) {
        toast.error("Failed to update bot settings");
      } else {
        setCrew((prev) => prev ? { ...prev, bot_name: name, bot_avatar_url: avatarUrl || null } : prev);
      }
    },
    [crewId]
  );

  const isOfficer = myRole === "owner" || myRole === "officer";

  if (loading || channelsLoading || !crew) {
    return (
      <div
        className="fixed inset-0 bg-background flex items-center justify-center z-50"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    );
  }

  // Calculate total unread for the back button badge
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // ── MOBILE LAYOUT ──
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
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Mobile Channels Header */}
              <div className="bg-card/95 backdrop-blur-md border-b border-border/50 shrink-0">
                <div className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/units/${crewId}`)}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors active:scale-95 touch-manipulation"
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div className="flex-1">
                    <h2 className="font-semibold text-sm">{crew.name}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{onlineMembers.length} online</span>
                      <span className="mx-1">·</span>
                      <span>{channels.length} channels</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Channel List */}
              <div className="flex-1 overflow-y-auto">
                {Object.entries(channelsByCategory)
                  .sort(([, a], [, b]) => {
                    const aOrder = a[0]?.category_order ?? 99;
                    const bOrder = b[0]?.category_order ?? 99;
                    return aOrder - bOrder;
                  })
                  .map(([category, categoryChannels]) => (
                    <div key={category} className="py-2">
                      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-4 mb-1.5">
                        {category}
                      </h4>
                      {categoryChannels
                        .sort((a, b) => a.channel_order - b.channel_order)
                        .map((channel) => {
                          const unread = unreadCounts[channel.id] || 0;
                          const icon = CHANNEL_ICONS[channel.channel_type] || CHANNEL_ICONS.text;
                          const isActive = channel.id === activeChannelId;

                          return (
                            <button
                              key={channel.id}
                              onClick={() => handleSelectChannel(channel.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/40 touch-manipulation",
                                isActive ? "bg-muted/20" : "hover:bg-muted/10"
                              )}
                            >
                              <span className="shrink-0">{icon}</span>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "text-sm truncate",
                                    unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                  )}>
                                    {channel.name}
                                  </span>
                                  {channel.is_locked && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                </div>
                                {channel.description && (
                                  <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
                                    {channel.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {unread > 0 && (
                                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                    {unread > 99 ? "99+" : unread}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {activeChannel && (
                <ChannelChatView
                  channel={activeChannel}
                  crewId={crewId!}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                  typingUsers={typingUsers}
                  onTyping={broadcastTyping}
                  isOfficer={isOfficer}
                  crewName={crew.name}
                  botName={crew.bot_name || undefined}
                  botAvatarUrl={crew.bot_avatar_url || undefined}
                  showBackOnMobile={true}
                  onBack={() => setMobileView("channels")}
                  onShowPermissions={
                    isOfficer && activeChannel
                      ? () => setPermissionsChannel(activeChannel)
                      : undefined
                  }
                />
              )}
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
      </div>
    );
  }

  // ── DESKTOP LAYOUT ──
  return (
    <div
      className="fixed inset-0 bg-background flex z-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Channel Sidebar */}
      <ChannelSidebar
        channels={channels}
        channelsByCategory={channelsByCategory}
        activeChannelId={activeChannel?.id || null}
        onSelectChannel={handleSelectChannel}
        unreadCounts={unreadCounts}
        onlineCount={onlineMembers.length}
        crewName={crew.name}
        isOfficer={isOfficer}
        onBack={() => navigate(`/units/${crewId}`)}
      />

      {/* Main Chat Area */}
      {activeChannel ? (
        <ChannelChatView
          channel={activeChannel}
          crewId={crewId!}
          messages={messages}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          typingUsers={typingUsers}
          onTyping={broadcastTyping}
          isOfficer={isOfficer}
          crewName={crew.name}
          botName={crew.bot_name || undefined}
          botAvatarUrl={crew.bot_avatar_url || undefined}
          onShowMembers={() => setShowMembers(!showMembers)}
          onShowPermissions={
            isOfficer && activeChannel
              ? () => setPermissionsChannel(activeChannel)
              : undefined
          }
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a channel to start chatting</p>
        </div>
      )}

      {/* Members Panel */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 224, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
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
    </div>
  );
}
