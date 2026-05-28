import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/AuthApi";
import toast from "react-hot-toast";

const RighsectionJoinRoom = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);

  const codeRefs = useRef([]);

  useEffect(() => {
    API.get("/auth/me", { _skipRefresh: true })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
        console.log("not signed in");
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const codeDigits = [...roomCode].slice(0.6);

  const handleCodeInput = (e, index) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!val) return;
    const chars = [...roomCode];
    chars[index] = val[val.length - 1];
    const newCode = chars.join("").slice(0, 6);
    setRoomCode(newCode);
    if (index < 5 && val) {
      codeRefs.current[index + 1]?.focus();
    }
  };
  const handleCodeKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = [...roomCode];
      if (chars[index]) {
        chars[index] = "";
        setRoomCode(chars.join(""));
      } else if (index > 0) {
        codeRefs.current[index - 1]?.focus();
        const prev = [...roomCode];
        prev[index - 1] = "";
        setRoomCode(prev.join(""));
      }
    }
    if (e.key === "ArrowLeft" && index > 0)
      codeRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      codeRefs.current[index + 1]?.focus();
  };
  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setRoomCode(pasted);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6)
      return toast.error("Enter the full 6-character code");
    if (!user && !guestName.trim()) return toast.error("Enter a display name");

    setLoading(true);
    try {
      const payload = { roomCode: code };
      if (!user) payload.guestName = guestName.trim();

      const res = await API.post("/rooms/join", payload);
      const { room, reconnectToken } = res.data;

      // persist session context
      localStorage.setItem(
        "uno_user",
        JSON.stringify({
          userId: user?.user_id || null,
          username: user?.username || guestName.trim(),
          avatarEmoji: user?.avatar_emoji || null,
          reconnectToken: reconnectToken || null,
          isGuest: !user,
        }),
      );

      toast.success("Joined!");
      navigate(`/lobby/${room.room_code}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = roomCode.length === 6;
  return (
    <div
      className="
    relative
    z-10
    w-[90dvw]
    min-h-[50dvh]
    lg:w-1/2
    lg:h-[80dvh]

    bg-[#333]/20
    backdrop-blur-2xl

    rounded-3xl
    overflow-hidden

    shadow-[0_8px_32px_rgba(230,0,255,0.37)]
    flex
    flex-col
    justify-center
    p-6
  "
    >
      <div
        className="
      absolute
      inset-0
      rounded-3xl
      bg-gradient-to-br
      from-teansparent
      to-white/20
      pointer-events-none
      z-0
      flex
      justify-center

    "
      />
      <div className="relative z-10 w-full max-w-sm mx-auto overflow-y-scroll lg:overflow-hidden lg:justify-center lg:items-center ">
        {/* Header */}
        <div>
          <h1
            className="text-white text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Join a room
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {authChecked && user
              ? `Joining as ${user.username}`
              : "Enter the 6-character room code"}
          </p>
        </div>

        {/* Logged-in user badge */}
        {authChecked && user && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(150,80,255,0.1)",
              border: "1px solid rgba(150,80,255,0.25)",
            }}
          >
            {/* avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(150,80,255,0.25)" }}
            >
              {user.avatar_emoji ? (
                <span className="text-xl">{user.avatar_emoji}</span>
              ) : (
                <span
                  className="text-sm font-bold text-purple-200"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {user.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {user.username}
              </p>
              <p className="text-xs text-white/35">Signed in</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-xs text-purple-300/50 hover:text-purple-300/80
                      transition-colors cursor-pointer"
            >
              Switch
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ── 6-digit code input ── */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-[1.5px] uppercase text-white/30">
              Room code
            </p>
            <div
              className="flex gap-2 justify-between"
              onPaste={handleCodePaste}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={codeDigits[i] || ""}
                  onChange={(e) => handleCodeInput(e, i)}
                  onKeyDown={(e) => handleCodeKeyDown(e, i)}
                  onClick={() => codeRefs.current[i]?.select()}
                  className="w-full aspect-square rounded-xl text-center
                          font-black text-lg uppercase outline-none
                          transition-all duration-150"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    background: codeDigits[i]
                      ? "rgba(150,80,255,0.2)"
                      : "rgba(255,255,255,0.05)",
                    border: codeDigits[i]
                      ? "1.5px solid rgba(150,80,255,0.5)"
                      : "1.5px solid rgba(255,255,255,0.1)",
                    color: codeDigits[i]
                      ? "rgba(220,180,255,0.95)"
                      : "rgba(255,255,255,0.2)",
                    caretColor: "rgba(180,140,255,0.8)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Guest name — only shown when not logged in ── */}
          {authChecked && !user && (
            <div className="relative">
              <UserIcon />
              <input
                type="text"
                placeholder="Your display name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={32}
                required={!user}
                className="auth-field pl-10 text-white outline-none"
              />
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={
              loading || !isCodeComplete || (!user && !guestName.trim())
            }
            className="w-full py-3 mt-1 rounded-xl
                    bg-purple-600/50 hover:bg-purple-600/70
                    border border-purple-400/30
                    text-white text-sm font-semibold tracking-wide
                    shadow-[0_0_20px_rgba(168,85,247,0.3)]
                    hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]
                    transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Joining…" : "Join Room"}
          </button>
        </form>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/25 tracking-widest uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Create room link */}
        <div className="text-center">
          <p className="text-xs text-white/25">
            Want to host?{" "}
            <span
              onClick={() => navigate("/roomCreator")}
              className="text-purple-300/60 hover:text-purple-300
                      cursor-pointer transition-colors"
            >
              Create a room
            </span>
          </p>
          {!user && (
            <p className="text-xs text-white/25 mt-2">
              Have an account?{" "}
              <span
                onClick={() => navigate("/auth")}
                className="text-purple-300/60 hover:text-purple-300
                        cursor-pointer transition-colors"
              >
                Sign in
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
const UserIcon = () => (
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

export default RighsectionJoinRoom;
