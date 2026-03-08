import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Plus, MessageSquare, Trash2, Send, Loader2, Star, Swords, Trophy, Users, Zap,
  Menu, X, ChevronRight, Brain, PanelLeftClose, PanelLeft
} from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import GatePattern from '@/components/loopgate/GatePattern';
import { useLoopyChat } from '@/hooks/useLoopyChat';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import loopyAvatar from '@/assets/loopy-avatar.png';

const TEKO = { fontFamily: 'Teko, sans-serif' };

const QUICK_ACTIONS = [
  { label: '⚔️ Battle', msg: 'how do i start a battle?', icon: Swords },
  { label: '⭐ Rate Edit', route: '/loopy/rate', icon: Star },
  { label: '🏆 Drops', msg: 'whats dropping rn?', icon: Trophy },
  { label: '👥 Units', msg: 'tell me about units', icon: Users },
  { label: '📈 My Stats', msg: 'whats my current stats looking like?', icon: Zap },
];

export default function LoopyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;

  const {
    conversations,
    activeConversationId,
    messages,
    streaming,
    loadingHistory,
    displayName,
    sendMessage,
    startNewChat,
    continueLastChat,
    loadMessages,
    deleteConversation,
  } = useLoopyChat();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [started, setStarted] = useState(false);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  // Auto-start chat
  useEffect(() => {
    if (!started) {
      setStarted(true);
      if (conversations.length > 0) {
        continueLastChat();
      } else {
        startNewChat();
      }
    }
  }, [started, conversations.length, continueLastChat, startNewChat]);

  // Focus input
  useEffect(() => {
    if (activeConversationId) setTimeout(() => inputRef.current?.focus(), 200);
  }, [activeConversationId]);

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput('');
    sendMessage(msg);
  };

  const handleNewChat = async () => {
    await startNewChat();
    setMobileSidebar(false);
  };

  const handleSelectConversation = async (convId: string) => {
    await loadMessages(convId);
    setMobileSidebar(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;
  const showWelcome = !hasMessages && !streaming && !loadingHistory;

  return (
    <>
      <Helmet>
        <title>Loopy AI — Your Loopgate Assistant</title>
        <meta name="description" content="Chat with Loopy, the AI oracle of Loopgate. Get help with battles, drops, rankings, and everything editing." />
      </Helmet>

      <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-120px)] flex bg-[#080808] relative overflow-hidden">
        <GatePattern opacity={1.5} color="white" tileSize={56} />

        {/* ═══ DESKTOP SIDEBAR ═══ */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:flex flex-col border-r border-white/[0.06] bg-[#0a0a0a] relative z-10 overflow-hidden shrink-0"
            >
              {/* Sidebar header */}
              <div className="p-3 border-b border-white/[0.06]">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all text-left group"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}
                >
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span className="text-[12px] font-bold text-white/60 tracking-wider" style={TEKO}>NEW CHAT</span>
                </button>
              </div>

              {/* Rate My Edit link */}
              <div className="px-3 pt-3">
                <button
                  onClick={() => navigate('/loopy/rate')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 hover:from-amber-500/20 hover:to-primary/20 transition-all text-left group"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold text-white/60 tracking-wider" style={TEKO}>RATE MY EDIT</span>
                  <ChevronRight className="w-3 h-3 text-white/20 ml-auto group-hover:text-amber-400 transition-colors" />
                </button>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto px-3 pt-4 space-y-0.5">
                {!isGuest && conversations.length > 0 && (
                  <>
                    <span className="text-[9px] font-bold text-white/15 uppercase tracking-[0.25em] px-2 mb-2 block" style={TEKO}>Recent Chats</span>
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-white/[0.04] transition-colors cursor-pointer ${
                          activeConversationId === conv.id ? 'bg-white/[0.06] border-l-2 border-purple-500' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleSelectConversation(conv.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-[11px] text-white/50 truncate">{conv.title}</p>
                          <p className="text-[9px] text-white/15">{new Date(conv.updated_at).toLocaleDateString()}</p>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-400/60" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="p-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 px-2">
                  <img src={loopyAvatar} alt="Loopy" className="w-7 h-7 rounded-full border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/60" style={TEKO}>LOOPY</span>
                      <span className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-purple-500/30 to-primary/30 text-purple-300 font-bold tracking-wider" style={TEKO}>v1.1</span>
                    </div>
                    <p className="text-[9px] text-white/20">loopgate oracle</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
        <AnimatePresence>
          {mobileSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 sm:hidden"
                onClick={() => setMobileSidebar(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-[#0a0a0a] border-r border-white/[0.06] z-50 flex flex-col sm:hidden"
              >
                <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <img src={loopyAvatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="text-[12px] font-bold text-white/60" style={TEKO}>LOOPY v1.1</span>
                  </div>
                  <button onClick={() => setMobileSidebar(false)} className="p-1 hover:bg-white/[0.06] rounded">
                    <X className="w-4 h-4 text-white/30" />
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all text-left"
                  >
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span className="text-[12px] font-bold text-white/60 tracking-wider" style={TEKO}>NEW CHAT</span>
                  </button>
                  <button
                    onClick={() => { setMobileSidebar(false); navigate('/loopy/rate'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 text-left"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-white/60 tracking-wider" style={TEKO}>RATE MY EDIT</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
                  {!isGuest && conversations.length > 0 && (
                    <>
                      <span className="text-[9px] font-bold text-white/15 uppercase tracking-[0.25em] px-2 mb-2 block" style={TEKO}>Recent</span>
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-sm hover:bg-white/[0.04] transition-colors ${
                            activeConversationId === conv.id ? 'bg-white/[0.06]' : ''
                          }`}
                        >
                          <p className="text-[11px] text-white/50 truncate">{conv.title}</p>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ═══ MAIN CHAT AREA ═══ */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-sm shrink-0">
            {/* Sidebar toggle */}
            <button
              onClick={() => {
                if (window.innerWidth < 640) setMobileSidebar(true);
                else setSidebarOpen(!sidebarOpen);
              }}
              className="p-1.5 hover:bg-white/[0.06] rounded transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-white/30 hidden sm:block" /> : <PanelLeft className="w-4 h-4 text-white/30 hidden sm:block" />}
              <Menu className="w-4 h-4 text-white/30 sm:hidden" />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={loopyAvatar} alt="Loopy" className="w-6 h-6 rounded-full border border-white/10" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12px] font-bold text-white/70" style={TEKO}>LOOPY</span>
                <GateIcon className="w-3 h-3 text-purple-400/60" />
                <span className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-purple-500/30 to-primary/30 text-purple-300 font-bold tracking-wider" style={TEKO}>v1.1</span>
              </div>
              <span className="text-[9px] text-white/15 hidden sm:block">
                {streaming ? 'thinking...' : 'loopgate oracle 🐱'}
              </span>
            </div>

            <button
              onClick={() => navigate('/loopy/rate')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 to-primary/15 border border-amber-500/25 hover:from-amber-500/25 hover:to-primary/25 transition-all shrink-0"
            >
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-white/60 tracking-wider" style={TEKO}>Rate Edit</span>
            </button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                </div>
              ) : (
                <>
                  {/* Welcome screen */}
                  {showWelcome && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16 space-y-6"
                    >
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-[-6px] bg-gradient-to-br from-purple-500/30 to-fuchsia-500/15 blur-xl" />
                        <img src={loopyAvatar} alt="Loopy" className="relative w-20 h-20 rounded-full border-2 border-white/10" />
                      </div>
                      <div>
                        <h2 className="text-[32px] font-black text-white/80 leading-none" style={TEKO}>
                          {displayName ? `wsg ${displayName}` : 'wsg'}
                        </h2>
                        <p className="text-[13px] text-white/25 mt-1">ask me anything about loopgate</p>
                      </div>

                      {/* Quick actions grid */}
                      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => {
                              if (action.route) navigate(action.route);
                              else if (action.msg) handleSend(action.msg);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-purple-500/20 transition-all text-[11px] text-white/40 hover:text-white/60"
                          >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Message list */}
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 shrink-0 mt-0.5">
                          <img src={loopyAvatar} alt="" className="w-7 h-7 rounded-full border border-white/10" />
                        </div>
                      )}
                      <div className={`max-w-[75%] px-4 py-3 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600/30 text-white/90 border border-purple-500/20'
                          : 'bg-white/[0.04] text-white/70 border border-white/[0.06]'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:leading-relaxed [&>ul]:my-1 [&>ul]:pl-4 [&>ol]:my-1 [&>ol]:pl-4 [&>li]:my-0.5 [&>strong]:text-white/90 [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs [&>code]:text-[11px] [&>code]:bg-white/[0.06] [&>code]:px-1 [&>code]:rounded">
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => {
                                  const isInternal = href?.startsWith('/');
                                  if (isInternal) {
                                    return (
                                      <button
                                        onClick={() => navigate(href!)}
                                        className="text-purple-400 underline underline-offset-2 hover:text-purple-300 font-medium transition-colors"
                                      >
                                        {children}
                                      </button>
                                    );
                                  }
                                  return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline underline-offset-2 hover:text-purple-300 font-medium transition-colors">
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
                          <span className="inline-block w-1.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Quick actions after greeting */}
                  {messages.length === 1 && !streaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 pl-10"
                    >
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            if (action.route) navigate(action.route);
                            else if (action.msg) handleSend(action.msg);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/30 hover:text-white/50 hover:bg-white/[0.05] hover:border-purple-500/20 transition-all"
                        >
                          {action.label}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Streaming indicator */}
                  {streaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                      <div className="w-7 h-7 shrink-0 mt-0.5">
                        <img src={loopyAvatar} alt="" className="w-7 h-7 rounded-full border border-white/10" />
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.06] px-4 py-3 flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-sm p-3 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] focus-within:border-purple-500/30 transition-colors px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ask loopy anything..."
                  disabled={streaming}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white/80 outline-none resize-none placeholder:text-white/20 disabled:opacity-50 max-h-32 py-1"
                  style={{ minHeight: '24px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || streaming}
                  className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 transition-colors shrink-0"
                >
                  {streaming ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
              <p className="text-center text-[9px] text-white/10 mt-1.5">
                Loopy v1.1 — loopgate oracle. may hallucinate sometimes ngl 🐱
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
