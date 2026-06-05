import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Swords, MessageSquare, Reply, Camera, Loader2, X, ChevronUp, Pencil, Plus, Check, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuickFightMessages, type QuickFightMessage } from '@/hooks/useQuickFight';
import { toast } from 'sonner';
import GifPicker from './GifPicker';
import SmartUsername from './SmartUsername';
import ChatBubble from './ChatBubble';
import { useChatBubble } from '@/lib/chatBubbleCache';

const DEFAULT_TRASH_TALK = [
  "yo wake up bro 👀",
  "Yo actually edit battle rn 🔥",
  "bro im better than you 😭✌️",
  "f*ck it let's die right here 💀",
  "I'll win fr fr",
  "Not even warmed up rn",
  "You cooked bro 💀",
  "This gonna be posted 📱",
  "No way you beatin me rn",
  "Bet. Run it.",
  "Loser owes $20",
  "Say less 🤝",
  "Gg already fr 😭",
  "brb im doin my edit rn",
];

function isMediaUrl(text: string): boolean {
  return (
    /\.(jpg|jpeg|png|webp|gif|gifv)(\?|$)/i.test(text) ||
    text.includes("tenor.com") ||
    text.includes("giphy.com") ||
    text.includes(".supabase.co/storage")
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] text-zinc-500 shrink-0">{text}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

interface QuickFightChatProps {
  fightId: string;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
}

export default function QuickFightChat({
  fightId,
  player1Id,
  player2Id,
  player1Username,
  player2Username,
}: QuickFightChatProps) {
  const { profile, user } = useAuth();
  const { messages } = useQuickFightMessages(fightId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [showAllChips, setShowAllChips] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(false);
  const [editingChips, setEditingChips] = useState(false);
  const [newChip, setNewChip] = useState('');
  const storageKey = user ? `quickfight:chips:${user.id}` : '';
  const [customChips, setCustomChips] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user) return DEFAULT_TRASH_TALK;
    try {
      const raw = localStorage.getItem(`quickfight:chips:${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return DEFAULT_TRASH_TALK;
  });
  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(customChips)); } catch {}
  }, [customChips, storageKey]);
  const addChip = () => {
    const t = newChip.trim();
    if (!t || customChips.includes(t) || customChips.length >= 24) return;
    setCustomChips([...customChips, t]);
    setNewChip('');
  };
  const removeChip = (text: string) => setCustomChips(customChips.filter(c => c !== text));
  const resetChips = () => setCustomChips(DEFAULT_TRASH_TALK);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [chatTab, setChatTab] = useState<'battle' | 'live'>('battle');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isParticipant = !!user && (user.id === player1Id || user.id === player2Id);

  const battleMessages = messages.filter(m => m.is_system || m.user_id === player1Id || m.user_id === player2Id);
  const liveMessages = messages.filter(m => !m.is_system);
  const visibleMessages = chatTab === 'battle' ? battleMessages : liveMessages;
  const battleCount = battleMessages.filter(m => !m.is_system).length;
  const liveCount = liveMessages.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatTab]);

  const sendMessage = async (text: string, isAutoText = false) => {
    if (!text.trim() || !profile || sending) return;
    setSending(true);
    const payload: Record<string, unknown> = {
      fight_id: fightId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: text.trim(),
      is_auto_text: isAutoText,
      channel: chatTab,
    };
    if (replyTo) {
      payload.reply_to_id = replyTo.id;
      payload.reply_to_username = replyTo.username;
      payload.reply_to_text = replyTo.text;
    }
    const { error } = await supabase.from('quick_fight_messages').insert(payload as any);
    if (error) toast.error('Failed to send');
    else {
      if (!isAutoText) setInput('');
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!profile) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${fightId}/${Date.now()}-${profile.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('battle-chat-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) { toast.error('Failed to upload photo'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('battle-chat-images').getPublicUrl(path);
    await sendMessage(publicUrl);
    setUploading(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    setShowGifPicker(false);
    sendMessage(gifUrl);
  };

  const handleReply = (msg: QuickFightMessage) => {
    const previewText = isMediaUrl(msg.message_text) ? '📷 Photo' : msg.message_text.slice(0, 60);
    setReplyTo({ id: msg.id, username: msg.username, text: previewText });
    inputRef.current?.focus();
  };

  const getColor = (userId: string) => {
    if (userId === player1Id) return 'text-red-400';
    if (userId === player2Id) return 'text-blue-400';
    return 'text-zinc-300';
  };

  const getBorderColor = (userId: string) => {
    if (userId === player1Id) return 'border-red-500/50';
    if (userId === player2Id) return 'border-blue-500/50';
    return 'border-white/10';
  };

  return (
    <div className="bg-black border border-white/10 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setChatOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
        aria-label={chatOpen ? 'Collapse chat' : 'Expand chat'}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-black uppercase tracking-wide text-white/60" style={{ fontFamily: 'Teko, sans-serif' }}>
            Chat
          </span>
          <span className="text-[9px] text-zinc-500">({messages.length})</span>
        </div>
        <ChevronUp className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${chatOpen ? '' : 'rotate-180'}`} />
      </button>

      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            {/* Header tabs */}
            <div className="flex border-b border-white/10 bg-black">
              <button
                onClick={() => { setChatTab('battle'); setReplyTo(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
                  chatTab === 'battle'
                    ? 'bg-white/5 border-b-2 border-white text-white'
                    : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'
                }`}
              >
                <Swords className={`w-3.5 h-3.5 ${chatTab === 'battle' ? 'text-white' : ''}`} />
                <span className="text-[11px] font-black uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Battle Chat
                </span>
                <span className="text-[9px] text-zinc-500">{battleCount}</span>
              </button>
              <button
                onClick={() => { setChatTab('live'); setReplyTo(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
                  chatTab === 'live'
                    ? 'bg-white/5 border-b-2 border-white text-white'
                    : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${chatTab === 'live' ? 'text-white' : ''}`} />
                <span className="text-[11px] font-black uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Live Chat
                </span>
                <span className="text-[9px] text-zinc-500">{liveCount}</span>
              </button>
            </div>

            {/* Fighter names bar — only on Battle Chat tab */}
            {chatTab === 'battle' && (
              <div className="flex items-center border-b border-white/5 bg-black/60">
                <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                  <span className="text-[10px] font-black text-red-300 uppercase tracking-wider truncate">{player1Username}</span>
                </div>
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest shrink-0">vs</span>
                <div className="flex-1 flex items-center justify-end gap-1.5 px-3 py-1.5">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider truncate text-right">{player2Username}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
                </div>
              </div>
            )}

      {/* Messages */}
      <div ref={scrollRef} className="h-[380px] sm:h-[440px] overflow-y-auto py-2 space-y-1 bg-[#0a0a0a]">
        {visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
            {chatTab === 'battle' ? (
              <>
                <span className="text-3xl opacity-30">⚔️</span>
                <span className="text-[10px] uppercase tracking-wide">Red vs Blue — no smack yet</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-7 h-7 opacity-30" />
                <span className="text-[10px] uppercase tracking-wide">Be the first to hype this battle</span>
              </>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => {
            if (msg.is_system) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <SystemMessage text={msg.message_text} />
                </motion.div>
              );
            }

            // RED (player1) always right, BLUE (player2) + spectators always left
            const isRed = msg.user_id === player1Id;
            const isBlue = msg.user_id === player2Id;
            const onRight = isRed;
            const showAvatar = !onRight; // avatar only on left-side messages

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className={`group flex gap-2 px-3 ${onRight ? 'justify-end' : ''}`}
              >
                {/* Avatar — left side only */}
                {showAvatar && (
                  <Avatar className={`w-10 h-10 shrink-0 border-2 mt-0.5 ${getBorderColor(msg.user_id)} ${
                    isBlue ? 'shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''
                  }`}>
                    <AvatarImage src={msg.avatar_url || ''} />
                    <AvatarFallback className={`text-[13px] font-black ${
                      isBlue ? 'bg-blue-500/20 text-blue-200' : 'bg-white/5 text-zinc-300'
                    }`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[78%] flex flex-col ${onRight ? 'items-end' : 'items-start'}`}>
                  {/* Name */}
                  <div className={`flex items-center gap-1.5 mb-0.5 ${onRight ? 'justify-end pr-0.5' : 'pl-0.5'}`}>
                    <SmartUsername
                      userId={msg.user_id}
                      username={msg.username}
                      prefix="@"
                      className={`text-[14px] font-bold ${getColor(msg.user_id)}`}
                    />
                  </div>

                  {/* Reply context */}
                  {msg.reply_to_username && (
                    <div className={`flex items-center gap-1 mb-0.5 text-[12px] text-zinc-500 ${onRight ? 'justify-end' : ''}`}>
                      <Reply className="w-3 h-3 rotate-180 shrink-0" />
                      <span className="truncate max-w-[220px]">@{msg.reply_to_username}: {msg.reply_to_text}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <QuickFightBubbleShell userId={msg.user_id} isRed={isRed} isBlue={isBlue}>
                    {isMediaUrl(msg.message_text) ? (
                      <img
                        src={msg.message_text}
                        alt=""
                        className="max-w-[320px] max-h-[260px] rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ChatBubble
                        userId={msg.user_id}
                        tone={isRed ? 'red' : isBlue ? 'blue' : 'neutral'}
                        tailSide={onRight ? 'right' : 'left'}
                      >
                        <p className="text-[19px] text-white leading-snug break-words">{msg.message_text}</p>
                      </ChatBubble>
                    )}

                    {/* Reply button — shows on hover */}
                    {user && (
                      <button
                        onClick={() => handleReply(msg)}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-300"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3 rotate-180" />
                      </button>
                    )}
                  </QuickFightBubbleShell>

                  <span className="text-[11px] text-zinc-600 mt-0.5 px-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Avatar — right side (RED) */}
                {isRed && (
                  <Avatar className="w-10 h-10 shrink-0 border-2 mt-0.5 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    <AvatarImage src={msg.avatar_url || ''} />
                    <AvatarFallback className="text-[13px] font-black bg-red-500/20 text-red-200">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="border-t border-white/10">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Quick-send chips — participants only, collapsible */}
      {user && isParticipant && (
        <div className="border-t border-white/10">
          <button
            onClick={() => { setChipsOpen(v => !v); if (chipsOpen) setEditingChips(false); }}
            className="w-full px-3 py-1.5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={chipsOpen ? 'Hide quick chats' : 'Show quick chats'}
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${chipsOpen ? '' : 'rotate-180'}`} />
          </button>
          <AnimatePresence initial={false}>
            {chipsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-3 pt-1 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(showAllChips || editingChips ? customChips : customChips.slice(0, 6)).map((text) => (
                      <div key={text} className="relative group">
                        <button
                          onClick={() => !editingChips && sendMessage(text, true)}
                          disabled={sending || editingChips}
                          className={`text-[11px] px-2.5 py-1 bg-white/5 border border-white/10 ${
                            editingChips
                              ? 'pr-6 text-zinc-300 border-amber-400/30'
                              : 'hover:border-amber-400/50 hover:bg-amber-400/10 text-zinc-300 hover:text-white active:scale-95'
                          } transition-all rounded-full disabled:opacity-60`}
                        >
                          {text}
                        </button>
                        {editingChips && (
                          <button
                            onClick={() => removeChip(text)}
                            className="absolute top-1/2 -translate-y-1/2 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/30 hover:bg-red-500/60 text-white"
                            aria-label="Remove chip"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!editingChips && customChips.length > 6 && (
                      <button
                        onClick={() => setShowAllChips(v => !v)}
                        className="text-[10px] px-2.5 py-1 border border-white/10 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full"
                      >
                        {showAllChips ? 'less' : `+${customChips.length - 6} more`}
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingChips(v => !v); setShowAllChips(true); }}
                      className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                        editingChips
                          ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                          : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {editingChips ? <><Check className="w-3 h-3" /> done</> : <><Pencil className="w-3 h-3" /> edit</>}
                    </button>
                  </div>
                  {editingChips && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Input
                        value={newChip}
                        onChange={(e) => setNewChip(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip())}
                        placeholder="add your own..."
                        maxLength={60}
                        className="h-7 text-[11px] bg-white/5 border-white/10 text-white rounded-full px-3 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-white/20"
                      />
                      <button
                        onClick={addChip}
                        disabled={!newChip.trim() || customChips.length >= 24}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 disabled:opacity-30"
                        aria-label="Add chip"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={resetChips}
                        className="h-7 px-2 flex items-center gap-1 rounded-full border border-white/10 text-[10px] text-zinc-500 hover:text-zinc-300"
                        title="Reset to defaults"
                      >
                        <RotateCcw className="w-3 h-3" /> reset
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Input */}
      {user ? (
        <div className="border-t border-white/10 bg-black">
          {/* Reply bar */}
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
              <Reply className="w-3 h-3 text-amber-400 shrink-0 rotate-180" />
              <span className="text-[10px] text-amber-400 font-bold shrink-0">@{replyTo.username}</span>
              <span className="text-[10px] text-zinc-500 truncate flex-1">{replyTo.text}</span>
              <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-2">
            {/* Photo upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="h-9 w-9 flex items-center justify-center shrink-0 border border-white/10 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
              title="Send photo"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            {/* GIF */}
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className={`h-9 w-9 flex items-center justify-center shrink-0 border rounded-lg transition-colors ${
                showGifPicker
                  ? 'bg-amber-400/20 border-amber-400/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
              title="Send GIF"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={replyTo ? `↩ @${replyTo.username}` : isParticipant ? 'Message...' : 'Hype the battle...'}
              maxLength={500}
              className="flex-1 h-9 text-[13px] bg-white/5 border-white/10 text-white rounded-lg placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-white/20"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="h-9 w-9 flex items-center justify-center bg-white hover:bg-zinc-200 text-black disabled:opacity-30 transition-colors rounded-lg shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 px-3 py-3 text-center bg-black">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Sign in to join the chat</span>
        </div>
      )}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
