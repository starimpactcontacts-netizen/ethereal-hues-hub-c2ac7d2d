import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Search, MoreVertical, Trash2, Tag, BadgeCheck, Users, UserX } from 'lucide-react';
import { useConversations, Conversation } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LABELS = ['Client', 'Friend', 'Rival', 'Collaborator', 'Mentor', 'Fan'];

interface ConversationItemProps {
  conv: Conversation;
  userId: string | undefined;
  onDelete: (id: string) => void;
  onLabel: (id: string, label: string | null) => void;
}

function ConversationItem({ conv, userId, onDelete, onLabel }: ConversationItemProps) {
  const navigate = useNavigate();
  const unreadCount = conv.participant_1_id === userId 
    ? conv.unread_count_1 
    : conv.unread_count_2;
  
  const myLabel = conv.participant_1_id === userId 
    ? conv.label_1 
    : conv.label_2;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on dropdown
    if ((e.target as HTMLElement).closest('[data-radix-collection-item]')) {
      e.preventDefault();
      return;
    }
    navigate(`/messages/${conv.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-4 hover:bg-surface-1 transition-colors cursor-pointer group"
    >
      {/* Avatar with verified badge */}
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
        {/* Verified badge */}
        {conv.other_user?.verification_status && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-background rounded-full flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
          </div>
        )}
        {/* Online indicator - only if not verified (to avoid overlap) */}
        {!conv.other_user?.verification_status && conv.other_user?.activity_status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
            {conv.other_user?.username || 'Unknown'}
          </span>
          {myLabel && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase tracking-wide">
              {myLabel}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {conv.last_message_preview || 'No messages yet'}
        </p>
      </div>

      {/* Time + Actions */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
        </span>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              <Tag className="w-3 h-3 inline mr-1.5" />
              Label
            </div>
            {LABELS.map((label) => (
              <DropdownMenuItem
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onLabel(conv.id, label);
                }}
                className={`text-xs ${myLabel === label ? 'bg-primary/10 text-primary' : ''}`}
              >
                {label}
                {myLabel === label && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            ))}
            {myLabel && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onLabel(conv.id, null);
                }}
                className="text-xs text-muted-foreground"
              >
                Remove Label
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="text-xs text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, loading, deleteConversation, updateLabel } = useConversations();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connected' | 'other'>('connected');

  // Split conversations by connection status
  const connectedConversations = conversations.filter(c => c.is_connected);
  const otherConversations = conversations.filter(c => !c.is_connected);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  const renderConversationList = (convs: Conversation[]) => {
    if (convs.length === 0) {
      return (
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-full bg-surface-1 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No conversations here</p>
        </div>
      );
    }

    return convs.map((conv) => (
      <ConversationItem
        key={conv.id}
        conv={conv}
        userId={user?.id}
        onDelete={setDeleteId}
        onLabel={updateLabel}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/hub" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-xl">Messages</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <Search size={14} />
            Browse Editors
          </Link>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'connected' | 'other')} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-surface-1 rounded-none border-b border-border h-11">
            <TabsTrigger 
              value="connected" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none relative gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Connected</span>
              {connectedConversations.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({connectedConversations.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="other"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none relative gap-2"
            >
              <UserX className="w-4 h-4" />
              <span>Other</span>
              {otherConversations.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({otherConversations.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connected" className="mt-0 divide-y divide-border">
            {renderConversationList(connectedConversations)}
          </TabsContent>
          
          <TabsContent value="other" className="mt-0 divide-y divide-border">
            {renderConversationList(otherConversations)}
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
