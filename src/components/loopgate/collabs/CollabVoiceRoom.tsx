import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Peer {
  userId: string;
  username: string;
  speaking: boolean;
  muted: boolean;
}

/**
 * Lightweight voice room using Supabase Realtime presence + WebRTC mesh.
 * Each peer publishes an SDP offer to newcomers via broadcast.
 * Audio only.
 */
export default function CollabVoiceRoom({
  slotId,
  open,
  onClose,
}: {
  slotId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<Record<string, Peer>>({});

  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnsRef = useRef<Record<string, RTCPeerConnection>>({});
  const audioElsRef = useRef<Record<string, HTMLAudioElement>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const myUsername =
    (user?.user_metadata as any)?.username ||
    user?.email?.split("@")[0] ||
    "guest";

  const cleanup = () => {
    Object.values(peerConnsRef.current).forEach((pc) => pc.close());
    peerConnsRef.current = {};
    Object.values(audioElsRef.current).forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    audioElsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setPeers({});
    setJoined(false);
    setMuted(false);
  };

  useEffect(() => {
    if (!open) cleanup();
    return () => cleanup();
    // eslint-disable-next-line
  }, [open]);

  const createPeerConnection = (peerId: string, channel: RealtimeChannel) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice",
          payload: { to: peerId, from: user!.id, candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      let audio = audioElsRef.current[peerId];
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        (audio as any).playsInline = true;
        containerRef.current?.appendChild(audio);
        audioElsRef.current[peerId] = audio;
      }
      audio.srcObject = e.streams[0];
    };

    peerConnsRef.current[peerId] = pc;
    return pc;
  };

  const join = async () => {
    if (!user) {
      toast.error("Sign in to join voice");
      return;
    }
    setJoining(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const channel = supabase.channel(`collab-voice-${slotId}`, {
        config: { presence: { key: user.id } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const next: Record<string, Peer> = {};
          Object.entries(state).forEach(([uid, metas]: any) => {
            const m = metas[0] || {};
            next[uid] = {
              userId: uid,
              username: m.username || "user",
              speaking: false,
              muted: !!m.muted,
            };
          });
          setPeers(next);
        })
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== user.id) return;
          const pc = peerConnsRef.current[payload.from] || createPeerConnection(payload.from, channel);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { to: payload.from, from: user.id, sdp: answer },
          });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== user.id) return;
          const pc = peerConnsRef.current[payload.from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload.to !== user.id) return;
          const pc = peerConnsRef.current[payload.from];
          if (pc && payload.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {}
          }
        })
        .on("broadcast", { event: "hello" }, async ({ payload }) => {
          // a newcomer announced — initiate offer to them
          if (payload.from === user.id) return;
          const pc = createPeerConnection(payload.from, channel);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { to: payload.from, from: user.id, sdp: offer },
          });
        });

      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ username: myUsername, muted: false });
          // tell existing peers we're here
          channel.send({
            type: "broadcast",
            event: "hello",
            payload: { from: user.id, username: myUsername },
          });
        }
      });

      setJoined(true);
    } catch (e: any) {
      toast.error(e?.message || "Mic permission denied");
      cleanup();
    } finally {
      setJoining(false);
    }
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const next = !muted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    channelRef.current?.track({ username: myUsername, muted: next });
  };

  const hangup = () => {
    cleanup();
    onClose();
  };

  if (!open) return null;

  const peerList = Object.values(peers);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={containerRef}
        className="relative w-full sm:max-w-sm bg-gradient-to-b from-[#0a1f0e] to-[#06120a] border-t-2 sm:border-2 border-emerald-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"
      >
        <div className="text-center mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300/80">Voice Room</p>
          <p className="text-[22px] font-black text-white" style={{ fontFamily: "Teko, sans-serif" }}>
            {joined ? `${peerList.length} in room` : "Live Voice Chat"}
          </p>
        </div>

        {joined && (
          <div className="grid grid-cols-3 gap-3 mb-5 max-h-[40vh] overflow-y-auto">
            {peerList.map((p) => (
              <div key={p.userId} className="flex flex-col items-center gap-1">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-[20px] font-black shadow-[0_4px_0_rgba(0,0,0,0.5)] ${
                    p.muted
                      ? "bg-white/10 border border-white/20"
                      : "bg-gradient-to-b from-emerald-400 to-emerald-600 ring-2 ring-emerald-300/60"
                  }`}
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <p className="text-[10px] text-white/70 font-bold truncate max-w-[64px]">{p.username}</p>
                {p.muted ? (
                  <MicOff className="w-3 h-3 text-white/40" />
                ) : (
                  <Volume2 className="w-3 h-3 text-emerald-300" />
                )}
              </div>
            ))}
            {peerList.length === 0 && (
              <p className="col-span-3 text-center text-white/40 text-[12px] py-6">Just you so far…</p>
            )}
          </div>
        )}

        {!joined ? (
          <button
            onClick={join}
            disabled={joining}
            className="w-full py-4 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-black text-[14px] font-black uppercase tracking-widest shadow-[0_5px_0_rgba(0,0,0,0.5)] active:translate-y-[3px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {joining ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
            ) : (
              <><Mic className="w-4 h-4" /> Join Voice</>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-[2px] ${
                muted ? "bg-white/10 border border-white/20" : "bg-gradient-to-b from-emerald-400 to-emerald-600"
              }`}
            >
              {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-black" />}
            </button>
            <button
              onClick={hangup}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-[2px]"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}