import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Search } from 'lucide-react';
import { useConversations } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import AppHeader from '@/components/loopgate/AppHeader';

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, loading } = useConversations();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-14 z-40 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Link to="/hub" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-display text-xl">Messages</h1>
          </div>
        </div>

        {/* Conversations List */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-lg mb-2">No messages yet</h2>
              <p className="text-sm text-muted-foreground">
                Start a conversation by visiting someone's profile
              </p>
              <Link 
                to="/index" 
                className="inline-flex items-center gap-2 mt-4 text-gold hover:underline"
              >
                <Search size={14} />
                Browse Editors
              </Link>
            </div>
          ) : (
            conversations.map((conv) => {
              const unreadCount = conv.participant_1_id === user?.id 
                ? conv.unread_count_1 
                : conv.unread_count_2;
              
              return (
                <Link
                  key={conv.id}
                  to={`/messages/${conv.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-surface-1 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-surface-1 overflow-hidden">
                      {conv.other_user?.avatar_url ? (
                        <img 
                          src={conv.other_user.avatar_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-display text-muted-foreground">
                          {conv.other_user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    {conv.other_user?.activity_status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium truncate ${unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                        {conv.other_user?.username || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {conv.last_message_preview || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
