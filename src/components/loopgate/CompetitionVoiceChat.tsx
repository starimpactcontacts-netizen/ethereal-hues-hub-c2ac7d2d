import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, LocalParticipant, Participant, ConnectionState, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Radio, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitionVoiceChatProps {
  competitionId: string;
  className?: string;
  compact?: boolean;
}

interface SpeakerInfo {
  identity: string;
  name: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export function CompetitionVoiceChat({ competitionId, className, compact = false }: CompetitionVoiceChatProps) {
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

  if (compact) {
    const localSpeaker = speakers.find((s) => s.isLocal);
    const activeSpeakers = speakers.filter((s) => s.isSpeaking && !s.isMuted && !s.isLocal);
    const visibleSpeakers = activeSpeakers.length > 0 ? activeSpeakers.slice(0, 2) : speakers.filter((s) => !s.isLocal).slice(0, 2);

    return (
      <div className={cn('shrink-0 border-b border-border bg-surface-1/80 px-3 py-2', className)}>
        <div ref={audioContainerRef} className="hidden" aria-hidden />
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className={cn('w-3.5 h-3.5', state === 'connected' ? 'text-status-live' : 'text-muted-foreground')} />
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Voice</span>
            <span className="text-[10px] tabular-nums text-muted-foreground/70">{speakers.length}</span>
          </div>

          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {state === 'connecting' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Joining…
              </span>
            )}
            {state === 'error' && (
              <span className="text-[11px] text-destructive truncate">{error || 'Voice unavailable'}</span>
            )}
            {state === 'connected' && (
              <>
                {visibleSpeakers.map((s) => (
                  <span
                    key={s.identity}
                    className={cn(
                      'inline-flex items-center gap-1 min-w-0 max-w-[92px] rounded-full border px-1.5 py-0.5 text-[10px]',
                      s.isSpeaking && !s.isMuted
                        ? 'border-status-live/50 bg-status-live/10 text-status-live'
                        : 'border-border bg-surface-2 text-muted-foreground'
                    )}
                  >
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-bold uppercase shrink-0">
                        {s.name.charAt(0)}
                      </span>
                    )}
                    <span className="truncate">{s.name}</span>
                  </span>
                ))}
                {visibleSpeakers.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/70 truncate">{localSpeaker?.name || 'Connected'} in voice</span>
                )}
              </>
            )}
          </div>

          {needsAudioUnlock && state === 'connected' && (
            <button
              onClick={unlockAudio}
              className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-gold text-gold-foreground active:scale-95 transition shrink-0"
            >
              Enable
            </button>
          )}
          {state === 'connected' && (
            <button
              onClick={toggleMute}
              className={cn(
                'h-8 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold border transition active:scale-95 shrink-0',
                muted
                  ? 'bg-surface-2 border-border text-foreground hover:bg-surface-3'
                  : 'bg-status-live border-status-live text-background hover:bg-status-live/90'
              )}
            >
              {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-surface-1 border border-border p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio className={cn('w-4 h-4', state === 'connected' ? 'text-status-live animate-pulse' : 'text-muted-foreground')} />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Voice Lobby</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{speakers.length}</span>
        </div>
      </div>

      {state === 'connecting' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining voice…
        </div>
      )}

      {state === 'error' && (
        <div className="text-xs text-destructive py-2">{error || 'Voice unavailable'}</div>
      )}

      {state === 'connected' && (
        <>
          <div ref={audioContainerRef} className="hidden" aria-hidden />
          {needsAudioUnlock && (
            <button
              onClick={unlockAudio}
              className="w-full mb-2 py-2 rounded-lg text-xs font-semibold bg-gold text-gold-foreground hover:opacity-90"
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
                    ? 'bg-status-live/10 border-status-live/60 text-status-live'
                    : 'bg-surface-2 border-border text-muted-foreground'
                )}
              >
                {s.avatarUrl ? (
                  <img
                    src={s.avatarUrl}
                    alt={s.name}
                    className={cn(
                      'w-5 h-5 rounded-full object-cover border',
                      s.isSpeaking && !s.isMuted ? 'border-status-live' : 'border-border'
                    )}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold uppercase">
                    {s.name.charAt(0)}
                  </div>
                )}
                {s.isMuted ? <MicOff className="w-3 h-3 opacity-60" /> : <Mic className="w-3 h-3" />}
                <span className="font-medium">{s.name}{s.isLocal ? ' (you)' : ''}</span>
              </div>
            ))}
            {speakers.length === 0 && (
              <span className="text-[11px] text-muted-foreground">No one in voice yet</span>
            )}
          </div>

          <button
            onClick={toggleMute}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all border',
              muted
                ? 'bg-surface-2 border-border text-foreground hover:bg-surface-3'
                : 'bg-status-live border-status-live text-background hover:bg-status-live/90'
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