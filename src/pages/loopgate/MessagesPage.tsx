import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Search, MoreVertical, Trash2, Tag, BadgeCheck, Users, UserX } from 'lucide-react';
import { useConversations, Conversation } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  onOpenLabelSheet: (id: string) => void;
  onOpenActionsSheet: (id: string) => void;
  currentLabel: string | null;
}

function ConversationItem({ conv, userId, onDelete, onOpenLabelSheet, onOpenActionsSheet, currentLabel }: ConversationItemProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const unreadCount = conv.participant_1_id === userId 
    ? conv.unread_count_1 
    : conv.unread_count_2;

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-menu-button]')) {
      e.preventDefault();
      return;
    }
    navigate(`/messages/${conv.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) {
      onOpenActionsSheet(conv.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-1 active:bg-surface-1 transition-colors cursor-pointer group touch-manipulation"
    >
      {/* Avatar with verified badge - smaller */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-surface-1 overflow-hidden">
          {conv.other_user?.avatar_url ? (
            <img 
              src={conv.other_user.avatar_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-display text-muted-foreground">
              {conv.other_user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {conv.other_user?.verification_status && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-background rounded-full flex items-center justify-center">
            <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
          </div>
        )}
        {!conv.other_user?.verification_status && conv.other_user?.activity_status === 'online' && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium truncate ${unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
            {conv.other_user?.username || 'Unknown'}
          </span>
          {currentLabel && (
            <span className="text-[8px] px-1 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase tracking-wide">
              {currentLabel}
            </span>
          )}
        </div>
        <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {conv.last_message_preview || 'No messages yet'}
        </p>
      </div>

      {/* Time + Actions */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground">
          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
        </span>
        
        {unreadCount > 0 && (
          <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Mobile: Simple button that opens sheet */}
        {isMobile ? (
          <button 
            data-menu-button
            onTouchEnd={handleMenuClick}
            onClick={handleMenuClick}
            className="p-3 -m-1 rounded-lg active:bg-muted/50 touch-manipulation"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        ) : (
          /* Desktop: Dropdown menu */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                data-menu-button
                onClick={(e) => e.stopPropagation()} 
                className="p-2 rounded-lg opacity-100 hover:bg-muted/50 transition-all"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-surface-1 border-border">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLabelSheet(conv.id);
                }}
                className="text-xs"
              >
                <Tag className="w-3.5 h-3.5 mr-2" />
                {currentLabel ? 'Change Label' : 'Add Label'}
              </DropdownMenuItem>
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
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, loading, deleteConversation, updateLabel } = useConversations();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [labelSheetId, setLabelSheetId] = useState<string | null>(null);
  const [actionsSheetId, setActionsSheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connected' | 'other'>('connected');

  // Split conversations by connection status
  const connectedConversations = conversations.filter(c => c.is_connected);
  const otherConversations = conversations.filter(c => !c.is_connected);

  // Get current label for the conversation being edited
  const labelSheetConv = conversations.find(c => c.id === labelSheetId);
  const currentLabelForSheet = labelSheetConv
    ? (labelSheetConv.participant_1_id === user?.id ? labelSheetConv.label_1 : labelSheetConv.label_2)
    : null;

  // Get label for actions sheet conversation
  const actionsSheetConv = conversations.find(c => c.id === actionsSheetId);
  const actionsSheetLabel = actionsSheetConv
    ? (actionsSheetConv.participant_1_id === user?.id ? actionsSheetConv.label_1 : actionsSheetConv.label_2)
    : null;

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  const handleSelectLabel = async (label: string | null) => {
    if (labelSheetId) {
      await updateLabel(labelSheetId, label);
      setLabelSheetId(null);
    }
  };

  const getConvLabel = (conv: Conversation) => {
    return conv.participant_1_id === user?.id ? conv.label_1 : conv.label_2;
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
        onOpenLabelSheet={setLabelSheetId}
        onOpenActionsSheet={setActionsSheetId}
        currentLabel={getConvLabel(conv)}
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

      {/* Label Selection Sheet */}
      <Sheet open={!!labelSheetId} onOpenChange={(open) => !open && setLabelSheetId(null)}>
        <SheetContent side="bottom" className="bg-surface-1 border-border rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-center font-display">Choose Label</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-4">
            {LABELS.map((label) => (
              <button
                key={label}
                onClick={() => handleSelectLabel(label)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  currentLabelForSheet === label 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <span className="flex items-center justify-between">
                  {label}
                  {currentLabelForSheet === label && <span className="text-primary">✓</span>}
                </span>
              </button>
            ))}
            {currentLabelForSheet && (
              <button
                onClick={() => handleSelectLabel(null)}
                className="w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Remove Label
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Actions Sheet */}
      <Sheet open={!!actionsSheetId} onOpenChange={(open) => !open && setActionsSheetId(null)}>
        <SheetContent side="bottom" className="bg-surface-1 border-border rounded-t-2xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center font-display">Chat Options</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (actionsSheetId) {
                  setLabelSheetId(actionsSheetId);
                  setActionsSheetId(null);
                }
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted/30 active:bg-muted/50 touch-manipulation"
            >
              <Tag className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {actionsSheetLabel ? 'Change Label' : 'Add Label'}
              </span>
            </button>
            <button
              onClick={() => {
                if (actionsSheetId) {
                  setDeleteId(actionsSheetId);
                  setActionsSheetId(null);
                }
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-destructive/10 text-destructive active:bg-destructive/20 touch-manipulation"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">Delete Chat</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
