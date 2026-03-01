import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-react';
import loopyAvatar from '@/assets/loopy-avatar.png';
import { useLoopyChat } from '@/hooks/useLoopyChat';

export default function LoopyChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showPulse, setShowPulse] = useState(true);
  const [view, setView] = useState<'menu' | 'chat' | 'history'>('menu');
  const [docked, setDocked] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show drag hint after 4 seconds if not interacted
  useEffect(() => {
    if (!open && !docked) {
      const timer = setTimeout(() => setShowDragHint(true), 4000);
      return () => clearTimeout(timer);
    }
    setShowDragHint(false);
  }, [open, docked]);

  const {
    conversations,
    activeConversationId,
    messages,
    streaming,
    loadingHistory,
    sendMessage,
    startNewChat,
    continueLastChat,
    loadMessages,
    deleteConversation,
  } = useLoopyChat();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [view]);

  const handleOpen = () => {
    setOpen(true);
    setShowPulse(false);
    setDocked(false);
    if (activeConversationId && messages.length > 0) {
      setView('chat');
    } else {
      setView('menu');
    }
  };

  const handleNewChat = async () => {
    await startNewChat();
    setView('chat');
  };

  const handleContinue = async () => {
    await continueLastChat();
    setView('chat');
  };

  const handleSelectConversation = async (convId: string) => {
    await loadMessages(convId);
    setView('chat');
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    sendMessage(text);
  };

  // Handle drag end — if swiped far enough right, dock to edge
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 60) {
      setDocked(true);
    }
  };

  const hasHistory = conversations.length > 0;

  return (
    <>
      {/* ═══ DOCKED STATE — paw peeking from right edge ═══ */}
      <AnimatePresence>
        {!open && docked && (
          <motion.button
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setDocked(false)}
            className="fixed bottom-28 right-0 z-50 flex items-center group"
            aria-label="Open Loopy"
          >
            <div className="relative w-12 h-20 overflow-visible">
              {/* Paw / arm reaching around the edge */}
              <svg width="40" height="80" viewBox="0 0 40 80" className="absolute -left-3 top-0">
                {/* Arm */}
                <path
                  d="M38 15 Q30 12, 22 18 Q16 24, 16 40 Q16 56, 22 62 Q30 68, 38 65"
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth="1.5"
                />
                {/* Top claw */}
                <path d="M22 18 Q18 10, 14 8 Q12 7, 11 9 Q10 12, 14 16" fill="hsl(var(--foreground) / 0.7)" />
                <path d="M19 16 Q14 6, 10 5 Q8 5, 7 7 Q7 10, 11 14" fill="hsl(var(--foreground) / 0.6)" />
                <path d="M17 17 Q11 9, 7 10 Q5 11, 5 13 Q6 16, 10 17" fill="hsl(var(--foreground) / 0.5)" />
                {/* Bottom claw */}
                <path d="M22 62 Q18 70, 14 72 Q12 73, 11 71 Q10 68, 14 64" fill="hsl(var(--foreground) / 0.7)" />
                <path d="M19 64 Q14 74, 10 75 Q8 75, 7 73 Q7 70, 11 66" fill="hsl(var(--foreground) / 0.6)" />
                <path d="M17 63 Q11 71, 7 70 Q5 69, 5 67 Q6 64, 10 63" fill="hsl(var(--foreground) / 0.5)" />
                {/* Paw pads */}
                <circle cx="24" cy="30" r="3" fill="hsl(var(--primary) / 0.3)" />
                <circle cx="24" cy="40" r="4" fill="hsl(var(--primary) / 0.25)" />
                <circle cx="24" cy="50" r="3" fill="hsl(var(--primary) / 0.3)" />
              </svg>
              {/* Half-visible face peeking */}
              <motion.div 
                animate={{ x: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full overflow-hidden border-2 border-primary bg-background shadow-lg group-hover:shadow-primary/30 transition-shadow"
              >
                <img src={loopyAvatar} alt="Loopy peeking" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING BUTTON — draggable ═══ */}
      <AnimatePresence>
        {!open && !docked && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            drag="x"
            dragConstraints={{ left: 0, right: 100 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={handleOpen}
            className="fixed bottom-28 right-3 z-50 w-14 h-14 rounded-full bg-background border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden touch-none"
          >
            <img src={loopyAvatar} alt="Loopy" className="w-full h-full object-cover pointer-events-none" />
            {showPulse && (
              <>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full" />
              </>
            )}
            {/* Drag hint arrow */}
            <AnimatePresence>
              {showDragHint && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: [0, 6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ x: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
                  className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium whitespace-nowrap pointer-events-none flex items-center gap-0.5"
                >
                  <span>→</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ CHAT PANEL ═══ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
            className="fixed bottom-28 right-2 left-2 sm:left-auto sm:w-[360px] z-50 max-h-[65vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-3 py-2.5 bg-card border-b border-border"
            >
              {view !== 'menu' && (
                <button onClick={() => setView('menu')} className="p-1 rounded-full hover:bg-muted transition-colors">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <img src={loopyAvatar} alt="Loopy" className="w-8 h-8 rounded-full border border-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">Loopy</span>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">AI</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {view === 'history' ? 'chat history' : 'your loopgate guide'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>

            {/* MENU VIEW */}
            {view === 'menu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-2.5 min-h-[200px]">
                <div className="text-center mb-4">
                  <img src={loopyAvatar} alt="Loopy" className="w-16 h-16 rounded-full border-2 border-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">wsg — what u need?</p>
                </div>

                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">New Chat</p>
                    <p className="text-[10px] text-muted-foreground">start fresh</p>
                  </div>
                </button>

                {hasHistory && (
                  <>
                    <button
                      onClick={handleContinue}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors text-left"
                    >
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Continue Last Chat</p>
                        <p className="text-[10px] text-muted-foreground truncate">{conversations[0]?.title}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setView('history')}
                      className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1.5"
                    >
                      View all chats ({conversations.length})
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* HISTORY VIEW */}
            {view === 'history' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto min-h-[200px] max-h-[50vh]">
                {conversations.map(conv => (
                  <div key={conv.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-border hover:bg-muted/50 transition-colors group">
                    <button onClick={() => handleSelectConversation(conv.id)} className="flex-1 text-left min-w-0">
                      <p className="text-sm text-foreground truncate">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString()}</p>
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">no chats yet</div>
                )}
              </motion.div>
            )}

            {/* CHAT VIEW */}
            {view === 'chat' && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <img src={loopyAvatar} alt="" className="w-6 h-6 rounded-full border border-border mt-0.5 shrink-0" />
                          )}
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}>
                            {msg.content}
                            {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {streaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-start">
                          <img src={loopyAvatar} alt="" className="w-6 h-6 rounded-full border border-border mt-0.5 shrink-0" />
                          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 p-2 border-t border-border bg-card"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ask loopy anything..."
                    disabled={streaming}
                    className="flex-1 bg-muted text-foreground text-sm rounded-full px-3 py-2 outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all"
                  >
                    {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
