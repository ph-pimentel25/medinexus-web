"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  Clock,
  Stethoscope,
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import { supabase } from "../../lib/supabase";

interface ChatMessage {
  id: string;
  mine: boolean;
  name: string;
  time: string;
  text: string;
}

type Phase = "connecting" | "live" | "error";

export default function TelemedicineRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const appointmentId = use(params).id;

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [phase, setPhase] = useState<Phase>("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [remoteName, setRemoteName] = useState<string | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  const attachRemote = useCallback((track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
      track.attach(remoteVideoRef.current);
      setRemoteHasVideo(true);
    }
    if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
      track.attach(remoteAudioRef.current);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    async function join() {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) throw new Error("Entre na sua conta para acessar a teleconsulta.");

        const res = await fetch("/api/telemedicine/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ appointmentId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Não foi possível entrar na sala.");

        room
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, p: RemoteParticipant) => {
            setRemoteName(p.name || "Participante");
            attachRemote(track);
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            track.detach();
            if (track.kind === Track.Kind.Video) setRemoteHasVideo(false);
          })
          .on(RoomEvent.ParticipantDisconnected, () => {
            setRemoteName(null);
            setRemoteHasVideo(false);
          })
          .on(RoomEvent.Disconnected, () => {
            if (!cancelled) setPhase((p) => (p === "live" ? "error" : p));
            if (!cancelled) setErrorMsg((m) => m || "A conexão com a sala foi encerrada.");
          })
          .on(RoomEvent.DataReceived, (bytes: Uint8Array, p?: RemoteParticipant) => {
            const text = new TextDecoder().decode(bytes).slice(0, 2000);
            setChatMessages((prev) => [
              ...prev,
              {
                id: `r-${Date.now()}-${prev.length}`,
                mine: false,
                name: p?.name || "Participante",
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                text,
              },
            ]);
          });

        await room.connect(payload.url, payload.token);
        if (cancelled) {
          room.disconnect();
          return;
        }

        // Pede câmera e microfone; se o usuário negar, entra apenas ouvindo.
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
          setMicActive(false);
        }
        try {
          await room.localParticipant.setCameraEnabled(true);
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (pub?.track && localVideoRef.current) pub.track.attach(localVideoRef.current);
        } catch {
          setVideoActive(false);
        }

        room.remoteParticipants.forEach((p) => {
          setRemoteName(p.name || "Participante");
          p.trackPublications.forEach((pub) => {
            if (pub.track) attachRemote(pub.track as RemoteTrack);
          });
        });
        setPhase("live");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Falha ao conectar.");
        setPhase("error");
      }
    }

    join();
    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [appointmentId, attachRemote]);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const toggleMic = async () => {
    const next = !micActive;
    try {
      await roomRef.current?.localParticipant.setMicrophoneEnabled(next);
      setMicActive(next);
    } catch {
      setErrorMsg("Permita o acesso ao microfone nas configurações do navegador.");
    }
  };

  const toggleVideo = async () => {
    const next = !videoActive;
    try {
      await roomRef.current?.localParticipant.setCameraEnabled(next);
      setVideoActive(next);
      if (next) {
        const pub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Camera);
        if (pub?.track && localVideoRef.current) pub.track.attach(localVideoRef.current);
      }
    } catch {
      setErrorMsg("Permita o acesso à câmera nas configurações do navegador.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !roomRef.current) return;
    await roomRef.current.localParticipant.publishData(new TextEncoder().encode(text), { reliable: true });
    setChatMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        mine: true,
        name: "Você",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        text,
      },
    ]);
    setInputMessage("");
  };

  const handleEndCall = () => {
    roomRef.current?.disconnect();
    router.push("/solicitacoes");
  };

  if (phase === "connecting") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="animate-spin text-mn-teal" size={32} />
        <p className="mt-4 text-sm">Conectando à sala segura…</p>
        <p className="mt-1 text-xs text-slate-500">Permita câmera e microfone quando o navegador pedir.</p>
      </div>
    );
  }

  if (phase === "error" && !roomRef.current?.localParticipant?.identity) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-200">
        <AlertTriangle className="text-amber-400" size={36} />
        <h1 className="mt-4 text-lg font-bold">Não foi possível abrir a sala</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">{errorMsg}</p>
        <button
          type="button"
          onClick={() => router.push("/solicitacoes")}
          className="mt-6 rounded-xl bg-mn-teal px-5 py-2.5 text-sm font-semibold text-white"
        >
          Voltar às consultas
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mn-teal text-white">
            <Stethoscope size={18} />
          </div>
          <span className="text-sm font-bold text-white sm:text-base">MediNexus Telemedicina</span>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            <Lock size={12} className="text-mn-teal" />
            <span>Conexão criptografada em trânsito</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/60 px-3 py-1 font-mono text-xs text-slate-300">
            <Clock size={12} className="text-mn-teal" />
            <span>{formatTimer(callDuration)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
            showChat ? "bg-mn-teal text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <MessageSquare size={15} />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </header>

      {errorMsg && (
        <div className="bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-200">{errorMsg}</div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex flex-1 items-center justify-center p-2 sm:p-4">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${remoteHasVideo ? "" : "hidden"}`}
            />
            <audio ref={remoteAudioRef} autoPlay />
            {!remoteHasVideo && (
              <div className="p-6 text-center">
                <Loader2 className="mx-auto animate-spin text-mn-teal" size={28} />
                <p className="mt-4 text-sm text-slate-300">
                  {remoteName ? `${remoteName} está na sala (sem vídeo)` : "Aguardando o outro participante entrar…"}
                </p>
              </div>
            )}
            {remoteName && remoteHasVideo && (
              <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold">
                {remoteName}
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 h-36 w-48 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl sm:h-44 sm:w-60">
              {videoActive ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800 text-slate-400">
                  <VideoOff size={24} />
                  <span className="mt-1 text-[11px]">Câmera desativada</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold">
                <span>Você</span>
                {!micActive && <MicOff size={10} className="text-rose-400" />}
              </div>
            </div>
          </div>
        </div>

        {showChat && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-900/95">
            <div className="border-b border-slate-800 p-4 text-sm font-bold">Chat da sala</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
              <p className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-center text-[10px] text-slate-400">
                As mensagens existem só durante a chamada e não são salvas.
              </p>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.mine ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.mine ? "bg-mn-teal text-white" : "border border-slate-800 bg-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="mb-1 flex justify-between gap-2 text-[10px] opacity-75">
                      <span className="font-bold">{msg.name}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  maxLength={500}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-mn-teal"
                />
                <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-xl bg-mn-teal text-white">
                  <Send size={14} />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      <footer className="z-20 flex h-20 shrink-0 items-center justify-center border-t border-slate-800/80 bg-slate-900/90 px-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              micActive ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 text-white"
            }`}
            title={micActive ? "Desativar microfone" : "Ativar microfone"}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              videoActive ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 text-white"
            }`}
            title={videoActive ? "Desativar câmera" : "Ativar câmera"}
          >
            {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex h-12 items-center gap-2 rounded-2xl bg-rose-600 px-6 text-xs font-bold text-white hover:bg-rose-500"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline">Encerrar chamada</span>
          </button>
        </div>
      </footer>

      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
            <h3 className="text-lg font-bold text-white">Deseja sair da teleconsulta?</h3>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Voltar à consulta
              </button>
              <button
                type="button"
                onClick={handleEndCall}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
