import { useEffect, useRef, useState } from 'react';
import { Send, Trophy, Crown, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';

interface ChatMsg {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
}

interface LeaderRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_cents: number;
  posts: number;
}

interface MissionOption {
  id: string;
  title: string;
  status: string;
}

const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClippersCommunityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'rankings' | 'chat'>('rankings');
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [missionsList, setMissionsList] = useState<MissionOption[]>([]);
  const [missionFilter, setMissionFilter] = useState<string>('all'); // 'all' | mission_id
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load mission list for the filter
  useEffect(() => {
    supabase
      .from('missions')
      .select('id, title, status')
      .in('status', ['live', 'paused', 'closed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => setMissionsList((data || []) as MissionOption[]));
  }, []);

  // Load rankings — aggregate paid + earned per user, optionally filtered by mission
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc('get_mission_leaderboard', {
        _mission_id: missionFilter === 'all' ? null : missionFilter,
      });
      if (error) {
        console.error('leaderboard error', error);
        setLeaders([]);
        return;
      }
      setLeaders(((data || []) as any[]).map((r) => ({
        user_id: r.user_id,
        username: r.username || 'editor',
        avatar_url: r.avatar_url,
        total_cents: Number(r.total_cents) || 0,
        posts: Number(r.posts) || 0,
      })));
    };
    load();
  }, [missionFilter]);

  // Load chat + realtime
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('mission_global_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(80);
      setMessages(((data || []) as ChatMsg[]).reverse());
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    };
    load();
    const ch = supabase
      .channel('mission-global-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_global_chat' }, (payload) => {
        setMessages((m) => [...m, payload.new as ChatMsg].slice(-200));
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const send = async () => {
    if (!user) { setAuthOpen(true); return; }
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const { data: prof } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    const username = (prof as any)?.username || (user.user_metadata as any)?.username || user.email?.split('@')[0] || 'editor';
    const avatar_url = (prof as any)?.avatar_url || (user.user_metadata as any)?.avatar_url || null;
    await supabase.from('mission_global_chat').insert({
      user_id: user.id,
      username,
      avatar_url,
      message: trimmed.slice(0, 280),
    });
    setText('');
    setSending(false);
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-4">
        <h1 className="font-apple-tight text-[28px] font-bold text-white tracking-[-0.02em] leading-tight">Community</h1>
        <p className="text-[13px] text-[#8E8E93] mt-1">Top earners on Missions and the editor lounge.</p>

        {/* Segmented control */}
        <div
          className="mt-4 grid grid-cols-2 p-[3px] rounded-[10px]"
          style={{ background: 'rgba(118,118,128,0.24)' }}
        >
          <button
            onClick={() => setTab('rankings')}
            className={`h-8 rounded-[8px] text-[13px] font-semibold tracking-[-0.01em] transition-all ${
              tab === 'rankings' ? 'text-white' : 'text-[#8E8E93]'
            }`}
            style={tab === 'rankings' ? { background: '#3a3a3c', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' } : undefined}
          >
            Rankings
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`h-8 rounded-[8px] text-[13px] font-semibold tracking-[-0.01em] transition-all ${
              tab === 'chat' ? 'text-white' : 'text-[#8E8E93]'
            }`}
            style={tab === 'chat' ? { background: '#3a3a3c', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' } : undefined}
          >
            Global Chat
          </button>
        </div>
      </section>

      {tab === 'rankings' ? (
        <section className="max-w-6xl mx-auto px-4 mt-4 pb-10">
          {/* Mission filter chips */}
          <div className="-mx-4 px-4 overflow-x-auto mb-3 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-min pb-1">
              <FilterChip
                label="All missions"
                active={missionFilter === 'all'}
                onClick={() => setMissionFilter('all')}
              />
              {missionsList.map((m) => (
                <FilterChip
                  key={m.id}
                  label={m.title}
                  active={missionFilter === m.id}
                  onClick={() => setMissionFilter(m.id)}
                />
              ))}
            </div>
          </div>

          {leaders.length === 0 ? (
            <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
              <Trophy className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
              <p className="text-[15px] font-semibold text-white">No earnings yet</p>
              <p className="text-[12px] text-[#8E8E93] mt-1">Be the first one on the board.</p>
            </div>
          ) : (
            <div className="rounded-[16px] overflow-hidden" style={{ background: '#161618' }}>
              {leaders.map((r, i) => {
                const isMe = r.user_id === user?.id;
                return (
                  <div
                    key={r.user_id}
                    className="px-3 py-2.5 flex items-center gap-3"
                    style={{
                      borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
                      background: isMe ? 'rgba(48,209,88,0.06)' : 'transparent',
                    }}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {i === 0 ? <Crown className="w-5 h-5 text-[#FFD60A]" strokeWidth={2.4} /> :
                       i === 1 ? <Medal className="w-5 h-5 text-[#C0C0C0]" strokeWidth={2.4} /> :
                       i === 2 ? <Medal className="w-5 h-5 text-[#CD7F32]" strokeWidth={2.4} /> :
                       <span className="text-[13px] font-semibold text-[#8E8E93] tabular-nums">{i + 1}</span>}
                    </div>
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#3a3a3c,#1c1c1e)' }}
                    >
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[13px] font-semibold text-white/85">{r.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-white truncate tracking-[-0.01em]">@{r.username}</p>
                      <p className="text-[11px] text-[#8E8E93] tabular-nums">
                        {r.posts} {r.posts === 1 ? 'post' : 'posts'} approved
                      </p>
                    </div>
                    <p className="text-[15px] font-bold tabular-nums text-[#30D158] tracking-[-0.01em]">
                      {formatMoney(r.total_cents)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 mt-4 flex flex-col" style={{ minHeight: 'calc(100vh - 280px)' }}>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto rounded-t-[16px] p-3 space-y-2.5"
            style={{ background: '#161618', maxHeight: 'calc(100vh - 360px)' }}
          >
            {messages.length === 0 ? (
              <p className="text-center text-[12px] text-[#8E8E93] py-8">Be the first to say something.</p>
            ) : messages.map((m) => {
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#3a3a3c,#1c1c1e)' }}
                  >
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-semibold text-white/85">{m.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <p className="text-[10.5px] text-[#8E8E93] mb-0.5 px-1">@{m.username}</p>
                    <div
                      className="px-3 py-2 rounded-[14px] text-[14px] text-white tracking-[-0.01em] break-words"
                      style={{
                        background: mine ? '#30D158' : '#2c2c2e',
                        color: mine ? '#000' : '#fff',
                      }}
                    >
                      {m.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="rounded-b-[16px] p-2 flex items-center gap-2"
            style={{ background: '#1c1c1e', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              onFocus={() => { if (!user) setAuthOpen(true); }}
              placeholder={user ? 'Message the mission community…' : 'Sign in to chat'}
              maxLength={280}
              className="flex-1 h-9 px-3 text-[14px] outline-none rounded-[10px] text-white placeholder:text-[#8E8E93]"
              style={{ background: 'rgba(118,118,128,0.24)' }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
              style={{ background: '#30D158' }}
              aria-label="Send"
            >
              <Send className="w-4 h-4 text-black" strokeWidth={2.6} />
            </button>
          </div>
        </section>
      )}

      <AccountPromptModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Create your account to join the mission community chat."
      />
    </>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold tracking-[-0.01em] transition-all whitespace-nowrap max-w-[180px] truncate ${
        active ? 'text-black' : 'text-white/80'
      }`}
      style={{
        background: active ? '#30D158' : 'rgba(118,118,128,0.24)',
      }}
    >
      {label}
    </button>
  );
}