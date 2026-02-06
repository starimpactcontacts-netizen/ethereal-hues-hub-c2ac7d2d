import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewChannels, useChannelMessages, CrewChannel } from "@/hooks/useCrewChannels";
import { useChannelPresence } from "@/hooks/useChannelPresence";
import { useChannelUnread } from "@/hooks/useChannelUnread";
import PageTransition from "@/components/loopgate/PageTransition";
import ChannelSidebar from "@/components/loopgate/ChannelSidebar";
import ChannelChatView from "@/components/loopgate/ChannelChatView";
import ChannelMembersList from "@/components/loopgate/ChannelMembersList";
import { useIsMobile } from "@/hooks/use-mobile";

interface Crew {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
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
  const [showMembers, setShowMembers] = useState(!isMobile);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  // Get active channel from URL or default to first
  const activeChannelId = searchParams.get("channel");

  // Hooks for channels
  const { channels, channelsByCategory, loading: channelsLoading } = useCrewChannels(crewId);
  const { unreadCounts, markChannelAsRead } = useChannelUnread(crewId);

  // Find the active channel object
  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  // Hooks for messages and presence (only when we have an active channel)
  const { messages, sendMessage, loading: messagesLoading } = useChannelMessages(activeChannel?.id);
  const { onlineMembers, typingUsers, broadcastTyping } = useChannelPresence(crewId, activeChannel?.id);

  // Fetch crew and members
  useEffect(() => {
    if (!crewId) return;

    const fetchCrewData = async () => {
      setLoading(true);

      // Fetch crew
      const { data: crewData, error: crewError } = await supabase
        .from("crews")
        .select("id, name, avatar_url, owner_id")
        .eq("id", crewId)
        .single();

      if (crewError || !crewData) {
        navigate("/crews");
        return;
      }

      setCrew(crewData);

      // Fetch members
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

        // Check user's role
        if (user) {
          const myMembership = membersData.find((m) => m.user_id === user.id);
          setMyRole(myMembership?.role as "owner" | "officer" | "member" | null);
        }
      }

      setLoading(false);
    };

    fetchCrewData();
  }, [crewId, user, navigate]);

  // Set default channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const generalChannel = channels.find((c) => c.name === "general") || channels[0];
      setSearchParams({ channel: generalChannel.id }, { replace: true });
    }
  }, [channels, activeChannelId, setSearchParams]);

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

  const isOfficer = myRole === "owner" || myRole === "officer";

  if (loading || channelsLoading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-background flex flex-col z-50"
        style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        {/* Mobile Header */}
        <div
          className="bg-card/95 backdrop-blur-md border-b border-border/50 shrink-0"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                if (mobileView === "chat") {
                  setMobileView("sidebar");
                } else {
                  navigate(`/crews/${crewId}`);
                }
              }}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>

            {mobileView === "chat" && activeChannel ? (
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-muted-foreground/70" />
                <span className="text-sm font-semibold">{activeChannel.name}</span>
                <span className="text-xs text-muted-foreground/60">— {crew.name}</span>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-sm">{crew.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{onlineMembers.length} online</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Content */}
        {mobileView === "sidebar" ? (
          <div className="flex-1 overflow-y-auto">
            {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
              <div key={category} className="py-2">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-4 mb-1">
                  {category}
                </h4>
                {categoryChannels
                  .sort((a, b) => a.channel_order - b.channel_order)
                  .map((channel) => {
                    const unread = unreadCounts[channel.id] || 0;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                      >
                        <Hash className="w-5 h-5 text-muted-foreground/70" />
                        <span className="flex-1 text-left text-sm">{channel.name}</span>
                        {unread > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        ) : activeChannel ? (
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
          />
        ) : null}
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      className="fixed inset-0 bg-background flex z-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Channel Sidebar with integrated back button */}
      <ChannelSidebar
        channels={channels}
        channelsByCategory={channelsByCategory}
        activeChannelId={activeChannel?.id || null}
        onSelectChannel={handleSelectChannel}
        unreadCounts={unreadCounts}
        onlineCount={onlineMembers.length}
        crewName={crew.name}
        isOfficer={isOfficer}
        onBack={() => navigate(`/crews/${crewId}`)}
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
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Select a channel to start chatting</p>
        </div>
      )}

      {/* Members Panel */}
      {showMembers && (
        <ChannelMembersList members={members} onlineMembers={onlineMembers} />
      )}
    </div>
  );
}
