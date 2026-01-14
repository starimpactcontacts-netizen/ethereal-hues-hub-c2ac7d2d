import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
import { format } from "date-fns";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";

interface Message {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface Crew {
  id: string;
  name: string;
}

export default function CrewChatPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isDev } = useAuth();
  const { isGuest } = useGuestMode();
  const canModerate = isAdmin || isDev;
  const [crew, setCrew] = useState<Crew | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (crewId) {
      fetchInitialData();
    }
  }, [crewId]);

  useEffect(() => {
    if (!crewId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`crew-chat-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crew_messages",
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialData = async () => {
    if (!crewId) return;

    setLoading(true);

    // Fetch crew info
    const { data: crewData, error: crewError } = await supabase
      .from("crews")
      .select("id, name")
      .eq("id", crewId)
      .single();

    if (crewError || !crewData) {
      console.error("Error fetching crew:", crewError);
      navigate("/crews");
      return;
    }

    setCrew(crewData);

    // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("crew_messages")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!messagesError && messagesData) {
      setMessages(messagesData);
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    // Block guest users
    if (isGuest) {
      toast.error("Sign in to send messages");
      return;
    }
    
    if (!user || !profile || !crewId || !newMessage.trim()) return;

    setSending(true);

    const displayUsername = profile.display_name || profile.username || "Anonymous";

    const { error } = await supabase.from("crew_messages").insert({
      crew_id: crewId,
      user_id: user.id,
      username: displayUsername,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      message_text: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if message is within 5-minute delete window
  const canDeleteOwnMessage = (createdAt: string) => {
    const messageTime = new Date(createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - messageTime < fiveMinutes;
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("crew_messages")
      .delete()
      .eq("id", messageId);
    
    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    }
  };

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border shrink-0">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(`/crews/${crewId}`)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{crew.name}</h1>
              <p className="text-xs text-muted-foreground">Crew Chat</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet.</p>
              <p className="text-sm">Be the first to say something!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={message.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(message.display_name || message.username || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : ""}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-semibold">
                        {message.display_name || message.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(message.created_at), "HH:mm")}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-xl text-sm ${
                        isOwn
                          ? "bg-gold text-black rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      }`}
                    >
                      {message.message_text}
                    </div>
                    {/* Delete button - moderators or own message within 5 min */}
                    {(canModerate || (isOwn && canDeleteOwnMessage(message.created_at))) && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className={`ml-2 p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                          isOwn ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-destructive"
                        }`}
                        title={isOwn && !canModerate ? "Delete (5 min window)" : "Delete message"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 safe-bottom shrink-0">
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-muted/50"
              disabled={sending}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-gold text-black hover:bg-gold/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
