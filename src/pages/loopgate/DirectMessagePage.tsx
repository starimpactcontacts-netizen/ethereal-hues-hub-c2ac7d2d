import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Smile, MoreVertical, Trash2 } from 'lucide-react';
import { useDirectMessages, useConversations } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GifPicker from '@/components/loopgate/GifPicker';
import RichMessageContent from '@/components/loopgate/RichMessageContent';
import MessageReactions from '@/components/loopgate/MessageReactions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function DirectMessagePage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useDirectMessages(conversationId || null);
  const { conversations } = useConversations();
  
  const [messageText, setMessageText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Get other user from conversations
  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.other_user;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    
    const text = messageText;
    setMessageText('');
    await sendMessage(text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    await sendMessage(gifUrl);
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  const handleDeleteMessage = async (messageId: string) => {
    setSelectedMessageId(null);
    const { error } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user?.id);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted");
    }
  };

  const handleOpenMessageMenu = (messageId: string) => {
    if (isMobile) {
      setSelectedMessageId(messageId);
    }
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
      {/* Header - compact for mobile */}
      <header className="flex-none bg-background border-b border-border/50 px-3 py-2 flex items-center gap-2">
        <Link to="/messages" className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        
        <Link to={`/u/${otherUser?.username}`} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-none">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {otherUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {otherUser?.activity_status === 'online' && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />
            )}
          </div>
          
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{otherUser?.username || 'Loading...'}</p>
            <p className="text-[9px] text-muted-foreground">
              {otherUser?.activity_status === 'online' ? 'Online' : 'Tap to view profile'}
            </p>
          </div>
        </Link>
      </header>

      {/* Messages area - fills remaining space */}
      <main className="flex-1 overflow-y-auto overscroll-none">
        <div className="p-3 space-y-2 min-h-full flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden mb-3">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-medium text-muted-foreground">
                    {otherUser?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">{otherUser?.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1" />
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-1.5 group/msg ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar placeholder for alignment */}
                    <div className="w-6 flex-none">
                      {!isMe && showAvatar && (
                        <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                          {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                              {otherUser?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-start gap-1">
                        <div
                          className={`rounded-2xl px-3 py-1.5 break-words ${
                            isMe 
                              ? 'bg-primary text-primary-foreground rounded-br-sm' 
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <div className="text-[13px]">
                            <RichMessageContent content={msg.message_text} />
                          </div>
                        </div>
                        
                        {/* Delete menu for own messages - Sheet on mobile, Dropdown on desktop */}
                        {isMe && (
                          isMobile ? (
                            <button 
                              onClick={() => handleOpenMessageMenu(msg.id)}
                              className="p-1.5 rounded active:bg-muted/50 shrink-0 self-center touch-manipulation"
                            >
                              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/70" />
                            </button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded hover:bg-muted/50 shrink-0 transition-opacity self-center">
                                  <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/70" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32 bg-popover border-border">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-destructive text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        )}
                      </div>
                      
                      {/* Emoji Reactions */}
                      <MessageReactions 
                        messageId={msg.id} 
                        messageTable="direct_messages" 
                      />
                      
                      <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                        {formatMessageDate(msg.created_at)}
                        {isMe && msg.read_at && ' · Read'}
                      </p>
                    </div>
                  </div>
                );
              })}
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
              onClick={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-destructive/10 text-destructive active:bg-destructive/20 touch-manipulation"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">Delete Message</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="flex-none border-t border-border/50 max-h-[40vh] overflow-hidden">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Input area - fixed at bottom */}
      <footer className="flex-none bg-background border-t border-border/50 p-2">
        <div className="flex items-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="flex-none h-9 w-9"
            onClick={() => setShowGifPicker(!showGifPicker)}
          >
            <Smile size={18} className={showGifPicker ? 'text-primary' : 'text-muted-foreground'} />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[36px] max-h-[100px] resize-none bg-muted border-none text-sm py-2"
            rows={1}
          />
          
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className="flex-none h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="icon"
          >
            <Send size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
