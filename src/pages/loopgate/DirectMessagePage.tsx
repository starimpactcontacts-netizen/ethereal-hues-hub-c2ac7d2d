import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { useDirectMessages, useConversations } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GifPicker from '@/components/loopgate/GifPicker';
import RichMessageContent from '@/components/loopgate/RichMessageContent';

export default function DirectMessagePage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useDirectMessages(conversationId || null);
  const { conversations } = useConversations();
  
  const [messageText, setMessageText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  if (!conversationId) {
    navigate('/messages');
    return null;
  }

  return (
    <div className="h-[calc(100dvh-56px)] bg-background flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-surface-0 border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/messages" className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        
        <Link to={`/u/${otherUser?.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-surface-1 overflow-hidden">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-display text-muted-foreground">
                  {otherUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {otherUser?.activity_status === 'online' && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-0" />
            )}
          </div>
          
          <div className="min-w-0">
            <p className="font-medium truncate">{otherUser?.username || 'Loading...'}</p>
            <p className="text-[10px] text-muted-foreground">
              {otherUser?.activity_status === 'online' ? 'Online' : 'Tap to view profile'}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-surface-1 overflow-hidden mb-4">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-display text-muted-foreground">
                  {otherUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <p className="font-medium">{otherUser?.username}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a conversation
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar placeholder for alignment */}
                <div className="w-8 shrink-0">
                  {!isMe && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-surface-1 overflow-hidden">
                      {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-display text-muted-foreground">
                          {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 break-words ${
                      isMe 
                        ? 'bg-gold text-black rounded-br-sm' 
                        : 'bg-surface-1 text-foreground rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm">
                      <RichMessageContent content={msg.message_text} />
                    </div>
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                    {formatMessageDate(msg.created_at)}
                    {isMe && msg.read_at && ' · Read'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="shrink-0 border-t border-border">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-surface-0 border-t border-border p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => setShowGifPicker(!showGifPicker)}
          >
            <Smile size={20} className={showGifPicker ? 'text-gold' : 'text-muted-foreground'} />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none bg-surface-1 border-none"
            rows={1}
          />
          
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className="shrink-0 h-10 w-10 bg-gold hover:bg-gold/90 text-black"
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
