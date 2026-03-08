import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Plus, MessageSquare, Trash2, ChevronLeft, Star, Swords, Trophy, Users, Zap, Maximize2 } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { useNavigate } from 'react-router-dom';
import loopyAvatar from '@/assets/loopy-avatar.png';
import { useLoopyChat } from '@/hooks/useLoopyChat';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

const QUICK_ACTIONS = [
  { label: '⚔️ Battle', msg: 'how do i start a battle?', icon: Swords },
  { label: '⭐ Rate Edit', route: '/loopy', icon: Star },
  { label: '🏆 Drops', msg: 'whats dropping rn?', icon: Trophy },
  { label: '👥 Units', msg: 'tell me about units', icon: Users },
  { label: '📈 My Stats', msg: 'whats my current stats looking like?', icon: Zap },
];

export default function LoopyChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showPulse, setShowPulse] = useState(true);
  const [view, setView] = useState<'menu' | 'chat' | 'history'>('menu');
  const [docked, setDocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const { user } = useAuth();
  const isGuest = !user;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 200);
  }, [view]);

  const handleOpen = async () => {
    setOpen(true);
    setShowPulse(false);
    setDocked(false);
    if (isGuest) {
      if (!activeConversationId || messages.length === 0) await startNewChat();
      setView('chat');
    } else if (activeConversationId && messages.length > 0) {
      setView('chat');
    } else {
      setView('menu');
    }
  };

  const handleNewChat = async () => { await startNewChat(); setView('chat'); };
  const handleContinue = async () => { await continueLastChat(); setView('chat'); };
  const handleSelectConversation = async (convId: string) => { await loadMessages(convId); setView('chat'); };

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput('');
    sendMessage(msg);
  };

  const handleDock = (e: React.MouseEvent) => { e.stopPropagation(); setDocked(true); };
  const hasHistory = conversations.length > 0;

  return (
    <>
      {/* ═══ DOCKED STATE — paws ═══ */}
      <AnimatePresence>
        {!open && docked && (
          <motion.button
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setDocked(false)}
            className="fixed bottom-28 right-0 z-50 cursor-pointer group"
          >
            <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="flex flex-col gap-6 items-end">
              {[0, 1].map(i => (
                <svg key={i} width="36" height="28" viewBox="0 0 36 28" fill="none" className="drop-shadow-md -mr-3">
                  <rect x="18" y="9" width="20" height="10" rx="5" fill="#fff" stroke="#555" strokeWidth="0.8" />
                  <ellipse cx="16" cy="14" rx="14" ry="12" fill="#fff" stroke="#555" strokeWidth="0.8" />
                  <ellipse cx="18" cy="15" rx="5.5" ry="5" fill="#F9B4C2" stroke="#E8899A" strokeWidth="0.7" />
                  <ellipse cx="7" cy="8" rx="3.5" ry="3" fill="#F9B4C2" stroke="#E8899A" strokeWidth="0.6" />
                  <ellipse cx="4" cy="14" rx="3.5" ry="3" fill="#F9B4C2" stroke="#E8899A" strokeWidth="0.6" />
                  <ellipse cx="7" cy="20" rx="3.5" ry="3" fill="#F9B4C2" stroke="#E8899A" strokeWidth="0.6" />
                </svg>
              ))}
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING BUTTON ═══ */}
      <AnimatePresence>
        {!open && !docked && (
          <div className="fixed bottom-28 right-3 z-50">
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ delay: 0.2 }}
              onClick={handleDock}
              className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-destructive/20 hover:border-destructive/40 transition-colors"
            >
              <X className="w-2.5 h-2.5 text-muted-foreground" />
            </motion.button>
            <motion.button
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 20 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={handleOpen}
              className="w-14 h-14 rounded-full bg-background border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden"
            >
              <img src={loopyAvatar} alt="Loopy" className="w-full h-full object-cover pointer-events-none" />
              {showPulse && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full" />
                </>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ CHAT PANEL ═══ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
            className="fixed bottom-28 right-2 left-2 sm:left-auto sm:w-[380px] z-50 max-h-[70vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-card border-b border-border">
              {view !== 'menu' && !isGuest && (
                <button onClick={() => setView('menu')} className="p-1 rounded-full hover:bg-muted transition-colors">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <img src={loopyAvatar} alt="Loopy" className="w-8 h-8 rounded-full border border-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">Loopy</span>
                  <GateIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-primary/30 text-purple-300 font-bold tracking-wider">v1.1</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {view === 'history' ? 'chat history' : streaming ? 'thinking...' : 'loopgate oracle 🐱'}
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); navigate('/loopy'); }}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="Open Full View"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/loopy/rate'); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-primary/30 transition-all"
              >
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-foreground">Rate</span>
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* MENU VIEW */}
            {view === 'menu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-2.5 min-h-[200px]">
                <div className="text-center mb-4">
                  <img src={loopyAvatar} alt="Loopy" className="w-16 h-16 rounded-full border-2 border-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">wsg — loopy 1.1 loaded up 🧠</p>
                </div>

                <button
                  onClick={() => { setOpen(false); navigate('/loopy'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-primary/30 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Rate My Edit</p>
                    <p className="text-[10px] text-muted-foreground">instant AI diagnostic on any edit</p>
                  </div>
                </button>

                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">New Chat</p>
                    <p className="text-[10px] text-muted-foreground">ask me anything about loopgate</p>
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
                    <button onClick={() => setView('history')} className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1.5">
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
                    <button onClick={() => deleteConversation(conv.id)} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all">
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
                          <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:leading-relaxed [&>ul]:my-1 [&>ul]:pl-4 [&>ol]:my-1 [&>ol]:pl-4 [&>li]:my-0.5 [&>strong]:text-foreground [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs [&>code]:text-[11px] [&>code]:bg-background/30 [&>code]:px-1 [&>code]:rounded">
                                <ReactMarkdown
                                  components={{
                                    a: ({ href, children }) => {
                                      const isInternal = href?.startsWith('/');
                                      if (isInternal) {
                                        return (
                                          <button
                                            onClick={() => { setOpen(false); navigate(href!); }}
                                            className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium transition-colors"
                                          >
                                            {children}
                                          </button>
                                        );
                                      }
                                      return (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium transition-colors"
                                        >
                                          {children}
                                        </a>
                                      );
                                    },
                                  }}
                                >{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              msg.content
                            )}
                            {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Quick action chips — show after greeting or when idle */}
                      {messages.length <= 1 && !streaming && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex flex-wrap gap-1.5 pt-1"
                        >
                          {QUICK_ACTIONS.map((action) => (
                            <button
                              key={action.label}
                              onClick={() => {
                                if (action.route) {
                                  setOpen(false);
                                  navigate(action.route);
                                } else if (action.msg) {
                                  handleSend(action.msg);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full bg-white/[0.05] border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] hover:border-primary/30 transition-all"
                            >
                              {action.label}
                            </button>
                          ))}
                        </motion.div>
                      )}

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
