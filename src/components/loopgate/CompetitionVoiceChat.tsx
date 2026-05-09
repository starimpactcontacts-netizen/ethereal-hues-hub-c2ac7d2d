import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, LocalParticipant, Participant, ConnectionState, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Radio, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitionVoiceChatProps {
  competitionId: string;
  className?: string;
}

interface SpeakerInfo {
  identity: string;
  name: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export function CompetitionVoiceChat({ competitionId, className }: CompetitionVoiceChatProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [muted, setMuted] = useState(true);
  const [speakers, setSpeakers] = useState<SpeakerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const refreshSpeakers = (r: Room) => {
    const all: Participant[] = [r.localParticipant, ...Array.from(r.remoteParticipants.values())];
    setSpeakers(
      all.map((p) => {
        const micPub = p.getTrackPublication(Track.Source.Microphone);
        let avatarUrl: string | undefined;
        let displayName = p.name || '';
        if (p.metadata) {
          try {
            const meta = JSON.parse(p.metadata);
            avatarUrl = meta.avatar_url || undefined;
            displayName = meta.username || displayName;
          } catch (_) {}
        }
        if (!displayName) displayName = p.identity.slice(0, 6);
        return {
          identity: p.identity,
          name: displayName,
          avatarUrl,
          isSpeaking: p.isSpeaking,
          isMuted: !micPub || micPub.isMuted || !micPub.track,
          isLocal: p === r.localParticipant,
        };
      })
    );
  };

  useEffect(() => {
    mountedRef.current = true;
    let r: Room | null = null;

    const connect = async () => {
      setState('connecting');
      setError(null);
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          setState('error');
          setError('Sign in to join voice');
          return;
        }
        const { data, error: fnErr } = await supabase.functions.invoke('livekit-token', {
          body: { room: `competition:${competitionId}` },
        });
        if (fnErr || !data?.token || !data?.url) {
          throw new Error(fnErr?.message || 'Failed to get voice token');
        }
        r = new Room({ adaptiveStream: true, dynacast: true });
        const handle = () => mountedRef.current && refreshSpeakers(r!);
        r.on(RoomEvent.ParticipantConnected, handle)
          .on(RoomEvent.ParticipantDisconnected, handle)
          .on(RoomEvent.TrackMuted, handle)
          .on(RoomEvent.TrackUnmuted, handle)
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, _p: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
              const el = track.attach() as HTMLAudioElement;
              el.autoplay = true;
              (el as any).playsInline = true;
              audioContainerRef.current.appendChild(el);
              el.play().catch(() => {
                if (mountedRef.current) setNeedsAudioUnlock(true);
              });
            }
            handle();
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            track.detach().forEach((el) => el.remove());
            handle();
          })
          .on(RoomEvent.ActiveSpeakersChanged, handle)
          .on(RoomEvent.LocalTrackPublished, handle)
          .on(RoomEvent.AudioPlaybackStatusChanged, () => {
            if (r && mountedRef.current) setNeedsAudioUnlock(!r.canPlaybackAudio);
          })
          .on(RoomEvent.ConnectionStateChanged, (s) => {
            if (s === ConnectionState.Disconnected && mountedRef.current) setState('idle');
          });
        await r.connect(data.url, data.token);
        // auto-join muted: enable mic but immediately mute
        await r.localParticipant.setMicrophoneEnabled(true);
        await r.localParticipant.setMicrophoneEnabled(false);
        if (!mountedRef.current) {
          await r.disconnect();
          return;
        }
        setRoom(r);
        setMuted(true);
        setState('connected');
        setNeedsAudioUnlock(!r.canPlaybackAudio);
        refreshSpeakers(r);
      } catch (e) {
        console.error('voice connect failed', e);
        if (mountedRef.current) {
          setState('error');
          setError((e as Error).message);
        }
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (r) r.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  const toggleMute = async () => {
    if (!room) return;
    // Browsers require a user gesture to start audio playback
    if (!room.canPlaybackAudio) {
      try { await room.startAudio(); setNeedsAudioUnlock(false); } catch (_) {}
    }
    const next = !muted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!next);
      setMuted(next);
      refreshSpeakers(room);
    } catch (e) {
      console.error('mic toggle failed', e);
      setError('Microphone permission denied');
    }
  };

  const unlockAudio = async () => {
    if (!room) return;
    try {
      await room.startAudio();
      setNeedsAudioUnlock(false);
    } catch (e) {
      console.error('startAudio failed', e);
    }
  };

  return (
    <div className={cn('rounded-2xl bg-[#111114] border border-white/10 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className={cn('w-4 h-4', state === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-white/40')} />
          <span className="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">Voice Lobby</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <Users className="w-3 h-3" />
          <span>{speakers.length}</span>
        </div>
      </div>

      {state === 'connecting' && (
        <div className="flex items-center gap-2 text-xs text-white/60 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining voice…
        </div>
      )}

      {state === 'error' && (
        <div className="text-xs text-red-400 py-2">{error || 'Voice unavailable'}</div>
      )}

      {state === 'connected' && (
        <>
          <div ref={audioContainerRef} className="hidden" aria-hidden />
          {needsAudioUnlock && (
            <button
              onClick={unlockAudio}
              className="w-full mb-2 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400"
            >
              Tap to enable voice audio
            </button>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {speakers.map((s) => (
              <div
                key={s.identity}
                className={cn(
                  'flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-[11px] border transition-all',
                  s.isSpeaking && !s.isMuted
                    ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-white/70'
                )}
              >
                {s.avatarUrl ? (
                  <img
                    src={s.avatarUrl}
                    alt={s.name}
                    className={cn(
                      'w-5 h-5 rounded-full object-cover border',
                      s.isSpeaking && !s.isMuted ? 'border-emerald-400' : 'border-white/10'
                    )}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[9px] font-bold uppercase">
                    {s.name.charAt(0)}
                  </div>
                )}
                {s.isMuted ? <MicOff className="w-3 h-3 opacity-60" /> : <Mic className="w-3 h-3" />}
                <span className="font-medium">{s.name}{s.isLocal ? ' (you)' : ''}</span>
              </div>
            ))}
            {speakers.length === 0 && (
              <span className="text-[11px] text-white/40">No one in voice yet</span>
            )}
          </div>

          <button
            onClick={toggleMute}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all border',
              muted
                ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                : 'bg-emerald-500 border-emerald-400 text-black hover:bg-emerald-400'
            )}
          >
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </>
      )}
    </div>
  );
}

export default CompetitionVoiceChat;