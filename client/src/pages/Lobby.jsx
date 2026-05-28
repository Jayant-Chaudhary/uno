import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../routes/useSocket";
import AnimatedBackground from "../components/AnimatorGrid";
import API from "../api/AuthApi";
import toast from "react-hot-toast";
import LeftSection from "../components/authPage/Leftsection/LeftSectionauth";

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_BG = [
  "#4c1d95",
  "#831843",
  "#164e63",
  "#14532d",
  "#78350f",
  "#7f1d1d",
  "#1e3a5f",
  "#312e81",
];
const AVATAR_FG = [
  "#c4b5fd",
  "#f9a8d4",
  "#67e8f9",
  "#86efac",
  "#fcd34d",
  "#fca5a5",
  "#93c5fd",
  "#a5b4fc",
];

//helpers
function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ player, index }) {
  const name =
    player.display_name || player.username || player.guest_name || "?";
  if (player.avatar_emoji) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: AVATAR_BG[index % 8] }}
      >
        {player.avatar_emoji}
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{
        background: AVATAR_BG[index % 8],
        color: AVATAR_FG[index % 8],
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const Lobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [copied, setCopied] = useState(false);

  const countdownRef = useRef(null);

  //local-storage user
  const currentUser = JSON.parse(localStorage.getItem("uno_user") || "null");

  const isHost = room && currentUser && room.host_id === currentUser.userId;
  const canStart = isHost && players.length >= 2;

  const cardsPerPlayer = players.length >= 9 ? 5 : players.length >= 5 ? 6 : 7;

  //Socket callbacks
  const handleRoomUpdate = useCallback(({ room: r, players: p }) => {
    if (r) setRoom(r);
    if (p) setPlayers(p);
  }, []);

  const handleGameStarted = useCallback(
    ({ gameState }) => {
      setCountdown(3);
      let c = 3;
      countdownRef.current = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(countdownRef.current);
          navigate(`/game/${roomCode}`, { state: { gameState } });
        } else {
          setCountdown(c);
        }
      }, 1000);
    },
    [navigate, roomCode],
  );

  const handleBackToLobby = useCallback(() => {
    setCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleError = useCallback(({ message }) => {
    toast.error(message);
  }, []);

  const handlePlayerDisconnected = useCallback(
    ({ socketId }) => {
      API.get(`/rooms/${roomCode}`)
        .then((res) => {
          setRoom(res.data.room);
          setPlayers(res.data.players);
        })
        .catch(() => {});
    },
    [roomCode],
  );

  const handleRoomDeleted = useCallback(() => {
    toast.error("Host left — room closed");
    navigate("/");
  }, [navigate]);

  const { joinRoom, startGame, disconnect, intentionalDiscontect } = useSocket({
    onRoomUpdate: handleRoomUpdate,
    onGameStarted: handleGameStarted,
    onBackToLobby: handleBackToLobby,
    onRoomDeleted: handleRoomDeleted,
    onPlayerDisconnected: handlePlayerDisconnected,
    onError: handleError,
  });

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const res = await API.get(`/rooms/${roomCode}`);
        setRoom(res.data.room);
        setPlayers(res.data.players);
      } catch {
        toast.error("Room not found");
        navigate("/");
        return;
      }
      console.log("calling joinRoom with:", roomCode, currentUser?.userId);
      joinRoom(roomCode, currentUser?.userId, currentUser?.reconnectToken);
    }
    init();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [roomCode]); // eslint-disable-line

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleStartGame = () => {
    if (!canStart) return;
    startGame(roomCode, currentUser.userId);
  };

  const handleLeave = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("uno_user") || "null");
      await API.delete(`/rooms/${roomCode}/leave`, {
        params: {
          reconnectToken: stored?.reconnectToken || null,
        },
      });
    } catch (_) {}
    localStorage.removeItem("uno_user");
    intentionalDiscontect();
    disconnect();
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="absolute top-0 left-0 h-[100dvh] w-full">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="flex gap-1.5">
            {[0, 0.15, 0.3].map((d, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400/50"
                style={{ animation: `pulse 1.4s ease-in-out ${d}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Shared sub-components ───────────────────────────────────────────────────

  // Room code card
  const RoomCodeCard = (
    <div
      className="flex items-center justify-between px-5 py-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(200,150,255,0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 40px rgba(150,80,255,0.10)",
      }}
    >
      <div>
        <p className="text-[10px] font-medium tracking-[2px] uppercase text-white/30 mb-1">
          Room code
        </p>
        <p
          className="text-2xl md:text-3xl font-black tracking-[6px] md:tracking-[8px]"
          style={{
            fontFamily: "'Syne', sans-serif",
            color: "#c4b4ff",
            textShadow: "0 0 30px rgba(180,120,255,0.5)",
          }}
        >
          {roomCode}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: copied
            ? "rgba(100,220,150,0.1)"
            : "rgba(150,80,255,0.15)",
          border: copied
            ? "1px solid rgba(100,220,150,0.3)"
            : "1px solid rgba(150,80,255,0.3)",
          color: copied ? "rgba(140,240,180,0.9)" : "rgba(180,140,255,0.9)",
        }}
      >
        {copied ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );

  // Players list
  const PlayersList = (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-bold text-white/70"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Players
        </p>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(150,80,255,0.15)",
            border: "1px solid rgba(150,80,255,0.25)",
            color: "rgba(180,140,255,0.8)",
          }}
        >
          {players.length} / {room.max_players}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p, i) => {
          const name = p.display_name || p.username || p.guest_name || "Player";
          const isPlayerHost = room.host_id && p.user_id === room.host_id;
          const isMe = currentUser && p.user_id === currentUser.userId;

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: isPlayerHost
                  ? "rgba(150,80,255,0.07)"
                  : "rgba(255,255,255,0.03)",
                border: isPlayerHost
                  ? "1px solid rgba(200,150,255,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Avatar player={p} index={i} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {name}
                  </p>
                  {isMe && (
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider
                      px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-0.5">
                  {p.user_id ? "Registered" : "Guest"}
                </p>
              </div>

              {isPlayerHost && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest
                    px-2 py-1 rounded-md flex-shrink-0"
                  style={{
                    background: "rgba(200,150,255,0.15)",
                    border: "1px solid rgba(200,150,255,0.25)",
                    color: "rgba(200,150,255,0.9)",
                  }}
                >
                  Host
                </span>
              )}
            </div>
          );
        })}

        {/* empty waiting slots — max 3 shown */}
        {Array.from({
          length: Math.min(3, room.max_players - players.length),
        }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ border: "1.5px dashed rgba(255,255,255,0.10)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  animation: `pulse 2s ease-in-out ${i * 0.4}s infinite`,
                }}
              />
            </div>
            <p className="text-sm italic text-white/18">Waiting for player…</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Settings panel
  const SettingsPanel = (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        className="text-sm font-bold text-white/70 mb-3.5"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Game settings
      </p>
      <div className="flex flex-col gap-3">
        {[
          ["Max players", room.max_players],
          ["Cards per player", cardsPerPlayer],
          ["Room expires", "2 h"],
        ].map(([label, value], i, arr) => (
          <React.Fragment key={label}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">{label}</span>
              <span className="text-xs font-medium text-white/80">{value}</span>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-white/[0.06]" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Status indicator
  const StatusPanel = (
    <div
      className="rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "rgba(150,80,255,0.6)",
              animation: `pulse 1.4s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-white/35 leading-relaxed">
        {canStart
          ? "All set! Start whenever you're ready."
          : players.length < 2
            ? "Need at least 2 players to start."
            : "Waiting for host to start the game…"}
      </p>
    </div>
  );

  // Bottom action bar (shared between mobile + desktop)
  const ActionBar = (
    <div className="flex gap-3">
      {/* Leave — always visible */}
      <button
        onClick={handleLeave}
        className="flex-1 md:flex-none py-3 px-5 rounded-2xl text-sm font-semibold
          transition-all duration-200"
        style={{
          background: "rgba(255,50,50,0.08)",
          border: "1px solid rgba(255,80,80,0.2)",
          color: "rgba(255,120,120,0.8)",
        }}
      >
        Leave room
      </button>

      {/* Message placeholder — visual only for now */}
      <button
        disabled
        className="py-3 px-5 rounded-2xl text-sm font-semibold
          opacity-30 cursor-not-allowed"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          style={{ display: "inline" }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Start / waiting */}
      {isHost ? (
        <button
          onClick={handleStartGame}
          disabled={!canStart}
          className="flex-1 py-3 rounded-2xl font-black text-sm tracking-wide
            transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            fontFamily: "'Syne', sans-serif",
            background: canStart
              ? "rgba(130,60,230,0.45)"
              : "rgba(130,60,230,0.2)",
            border: "1px solid rgba(170,100,255,0.4)",
            color: "rgba(220,180,255,0.95)",
            boxShadow: canStart ? "0 0 24px rgba(130,60,230,0.3)" : "none",
          }}
        >
          Start game
        </button>
      ) : (
        <div
          className="flex-1 text-center text-xs text-white/25 py-3 rounded-2xl
            flex items-center justify-center"
          style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          Waiting for host…
        </div>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="absolute top-0 left-0 h-[100dvh] w-full">
      <AnimatedBackground />

      {/* Countdown overlay */}
      {countdown !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{
            background: "rgba(10,5,20,0.85)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p className="text-white/40 text-sm tracking-[3px] uppercase">
            Game starting in
          </p>
          <p
            key={countdown}
            className="font-black leading-none"
            style={{
              fontSize: "clamp(80px, 20vw, 120px)",
              color: "rgba(200,150,255,0.9)",
              textShadow: "0 0 60px rgba(180,100,255,0.5)",
              fontFamily: "'Syne', sans-serif",
              animation: "countPop 1s ease-in-out",
            }}
          >
            {countdown}
          </p>
        </div>
      )}

      {/* ── MOBILE layout (< md) ── */}
      <div className="relative z-10 flex flex-col h-full md:hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* header */}
          <div className="flex items-center justify-between pt-2">
            <LeftSection />
          </div>

          {RoomCodeCard}
          {PlayersList}
          {SettingsPanel}
          {StatusPanel}
        </div>

        {/* sticky bottom bar on mobile */}
        <div
          className="p-4 flex-shrink-0"
          style={{
            background: "rgba(13,13,20,0.85)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {ActionBar}
        </div>
      </div>

      {/* ── DESKTOP layout (>= md) ── */}
      <div className="relative z-10 hidden md:flex md:flex-col lg:flex-row items-center justify-center h-full p-6">
        <LeftSection />
        <div className="w-full max-w-3xl flex flex-col gap-5">
          {/* header */}

          {RoomCodeCard}

          {/* two-column grid */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 272px" }}
          >
            {/* left — players */}
            {PlayersList}

            {/* right — settings + status + actions */}
            <div className="flex flex-col gap-4">
              {SettingsPanel}
              {StatusPanel}
              {ActionBar}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes countPop {
          0%   { transform: scale(1.4); opacity: 0; }
          30%  { transform: scale(1.0); opacity: 1; }
          80%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Lobby;
