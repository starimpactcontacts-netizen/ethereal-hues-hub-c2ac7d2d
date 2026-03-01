import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import loopyAvatar from '@/assets/loopy-avatar.png';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loopy-chat`;

export default function LoopyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setShowPulse(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Add personalized greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const name = profile?.display_name || profile?.username || 'bro';
      setMessages([{
        role: 'assistant',
        content: `wsg ${name}. im loopy, ask me whatever about loopgate — battles, units, rankings, all that. i got u`
      }]);
    }
  }, [open, messages.length, profile]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setStreaming(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length === allMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev.slice(0, allMessages.length), { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'loopy crashed 💀' }));
        updateAssistant(err.error || 'bruh something broke 😭 try again');
        setStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { updateAssistant('no response 💀'); setStreaming(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* partial json, skip */ }
        }
      }
    } catch {
      updateAssistant('ngl something went wrong 😭 try again');
    }

    setStreaming(false);
  }, [input, messages, streaming]);

  return (
    <>
      {/* Floating Loopy Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-3 z-50 w-14 h-14 rounded-full bg-background border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden"
          >
            <img src={loopyAvatar} alt="Loopy" className="w-full h-full object-cover" />
            {showPulse && (
              <>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full" />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
            className="fixed bottom-20 right-2 left-2 sm:left-auto sm:w-[360px] z-50 max-h-[70vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-3 py-2.5 bg-card border-b border-border"
            >
              <img src={loopyAvatar} alt="Loopy" className="w-8 h-8 rounded-full border border-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">Loopy</span>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">AI</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">your loopgate guide • ask me anything</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
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

              {/* Typing indicator when waiting for first token */}
              {streaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <img src={loopyAvatar} alt="" className="w-6 h-6 rounded-full border border-border mt-0.5 shrink-0" />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
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
                {streaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
