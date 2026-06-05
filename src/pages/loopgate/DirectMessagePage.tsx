import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Smile, MoreVertical, Trash2, Reply } from 'lucide-react';
import { useDirectMessages, useConversations } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { useDMTyping } from '@/hooks/useDMTyping';
import { playMessageSent, playMessageReceived } from '@/hooks/useDMSounds';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import GifPicker from '@/components/loopgate/GifPicker';
import RichMessageContent from '@/components/loopgate/RichMessageContent';
import ChatBubble from '@/components/loopgate/ChatBubble';
import MessageReactions from '@/components/loopgate/MessageReactions';
import DMTypingIndicator from '@/components/loopgate/DMTypingIndicator';
import DMReplyBar from '@/components/loopgate/DMReplyBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SmartUsername from '@/components/loopgate/SmartUsername';

interface ReplyTarget {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
}

export default function DirectMessagePage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useDirectMessages(conversationId || null);
  const { conversations } = useConversations();
  const { typingUsers, setTyping, clearTyping } = useDMTyping(conversationId || null);

  const [messageText, setMessageText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);
  const isMobile = useIsMobile();

  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.other_user;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Play sound on new incoming message
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender_id !== user?.id) {
        playMessageReceived();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, user?.id]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const text = messageText;
    setMessageText('');
    clearTyping();
    playMessageSent();

    // If replying, include reply data
    if (replyTarget) {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId!,
          sender_id: user!.id,
          message_text: text.trim(),
          reply_to_id: replyTarget.id,
          reply_to_text: replyTarget.text.substring(0, 100),
          reply_to_sender_id: replyTarget.senderId,
        } as any);

      if (error) {
        toast.error('Failed to send message');
      }
      setReplyTarget(null);
    } else {
      await sendMessage(text);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    setTyping();
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    playMessageSent();
    await sendMessage(gifUrl);
  };

  const handleDeleteMessage = async (messageId: string) => {
    setSelectedMessageId(null);
    const { error } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user?.id);

    if (error) toast.error("Failed to delete");
    else toast.success("Deleted");
  };

  const handleReply = useCallback((msg: any) => {
    const isMe = msg.sender_id === user?.id;
    setReplyTarget({
      id: msg.id,
      text: msg.message_text,
      senderId: msg.sender_id,
      senderName: isMe ? 'You' : (otherUser?.username || 'User'),
    });
    setSelectedMessageId(null);
    inputRef.current?.focus();
  }, [user?.id, otherUser?.username]);

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  const getDateSeparator = (dateStr: string, prevDateStr?: string) => {
    const date = new Date(dateStr);
    if (prevDateStr && isSameDay(date, new Date(prevDateStr))) return null;
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (!conversationId) {
    navigate('/messages');
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-background flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom))'
      }}
    >
      {/* Header */}
      <header className="flex-none bg-background/80 backdrop-blur-xl border-b border-border/30 px-3 py-2.5 flex items-center gap-2.5 z-10">
        <Link to="/messages" className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all touch-manipulation">
          <ArrowLeft size={20} />
        </Link>

        <Link to={`/u/${otherUser?.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-none">
            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden ring-1 ring-border/30">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {otherUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {otherUser?.activity_status === 'online' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate leading-tight">
              {otherUser ? <SmartUsername userId={otherUser.id} username={otherUser.username} /> : 'Loading...'}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {otherUser?.activity_status === 'online' ? (
                <span className="text-emerald-400">Online</span>
              ) : 'Offline'}
            </p>
          </div>
        </Link>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto overscroll-none">
        <div className="px-3 py-3 min-h-full flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden ring-2 ring-border/20">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-muted-foreground">
                    {otherUser?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold">
                {otherUser && <SmartUsername userId={otherUser.id} username={otherUser.username} />}
              </p>
              <p className="text-xs text-muted-foreground">Send a message to start the conversation</p>
            </div>
          ) : (
            <>
              <div className="flex-1" />
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isConsecutive = prevMsg?.sender_id === msg.sender_id;
                const dateSep = getDateSeparator(msg.created_at, prevMsg?.created_at);
                const replyData = (msg as any).reply_to_text ? {
                  text: (msg as any).reply_to_text,
                  isMe: (msg as any).reply_to_sender_id === user?.id,
                } : null;

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {dateSep && (
                      <div className="flex items-center justify-center py-3">
                        <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-full">
                          {dateSep}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'} group/msg`}
                    >
                      {/* Other user avatar */}
                      {!isMe && (
                        <div className="w-7 flex-none mr-1.5 self-end">
                          {!isConsecutive ? (
                            <div className="w-7 h-7 rounded-full bg-muted overflow-hidden">
                              {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                  {otherUser?.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Reply preview */}
                        {replyData && (
                          <div className={`flex items-center gap-1 mb-0.5 px-2 py-1 rounded-lg bg-muted/40 border-l-2 border-primary/40 max-w-full ${isMe ? 'self-end' : 'self-start'}`}>
                            <Reply className="w-3 h-3 text-primary/50 shrink-0 rotate-180" />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {replyData.isMe ? 'You' : otherUser?.username}: {replyData.text}
                            </span>
                          </div>
                        )}

                        {/* Bubble + actions row */}
                        <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2 break-words ${
                              isMe
                                ? `bg-primary text-primary-foreground ${isConsecutive ? 'rounded-br-md' : 'rounded-br-sm'}`
                                : `bg-muted/60 text-foreground ${isConsecutive ? 'rounded-bl-md' : 'rounded-bl-sm'}`
                            }`}
                            onDoubleClick={() => handleReply(msg)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setSelectedMessageId(msg.id);
                            }}
                          >
                            <div className="text-[13.5px] leading-relaxed">
                              <ChatBubble userId={msg.sender_id}>
                                <RichMessageContent content={msg.message_text} />
                              </ChatBubble>
                            </div>
                          </div>

                          {/* Quick reply button */}
                          <button
                            onClick={() => handleReply(msg)}
                            className="p-1 rounded-full opacity-0 group-hover/msg:opacity-100 sm:opacity-0 hover:bg-muted/50 transition-opacity shrink-0 touch-manipulation"
                          >
                            <Reply className="w-3.5 h-3.5 text-muted-foreground/60 rotate-180" />
                          </button>
                        </div>

                        {/* Reactions */}
                        <MessageReactions messageId={msg.id} messageTable="direct_messages" />

                        {/* Timestamp */}
                        {(!isConsecutive || index === messages.length - 1) && (
                          <p className={`text-[10px] text-muted-foreground/50 mt-0.5 px-1 ${isMe ? 'text-right' : ''}`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                            {isMe && msg.read_at && ' · Read'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              <DMTypingIndicator typingUsers={typingUsers} />

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Mobile Message Actions Sheet */}
      <Sheet open={!!selectedMessageId} onOpenChange={(open) => !open && setSelectedMessageId(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="sr-only">
            <SheetTitle>Message Actions</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                const msg = messages.find(m => m.id === selectedMessageId);
                if (msg) handleReply(msg);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted/50 text-foreground active:bg-muted/80 touch-manipulation"
            >
              <Reply className="w-5 h-5 rotate-180" />
              <span className="text-sm font-medium">Reply</span>
            </button>
            {messages.find(m => m.id === selectedMessageId)?.sender_id === user?.id && (
              <button
                onClick={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}
                className="flex items-center gap-3 w-full p-3 rounded-lg bg-destructive/10 text-destructive active:bg-destructive/20 touch-manipulation"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Delete Message</span>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="flex-none border-t border-border/30 max-h-[40vh] overflow-hidden">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Reply bar */}
      {replyTarget && (
        <DMReplyBar
          username={replyTarget.senderName}
          text={replyTarget.text}
          isMe={replyTarget.senderId === user?.id}
          onClear={() => setReplyTarget(null)}
        />
      )}

      {/* Input */}
      <footer className="flex-none bg-background/80 backdrop-blur-xl border-t border-border/30 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="flex-none h-9 w-9 rounded-full"
            onClick={() => setShowGifPicker(!showGifPicker)}
          >
            <Smile size={20} className={showGifPicker ? 'text-primary' : 'text-muted-foreground'} />
          </Button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full h-9 bg-muted/40 border border-border/30 rounded-full px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              maxLength={1000}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className="flex-none h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30"
            size="icon"
          >
            <Send size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
