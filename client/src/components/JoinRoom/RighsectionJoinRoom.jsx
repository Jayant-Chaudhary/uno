import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import API from "../../api/AuthApi";
import toast from "react-hot-toast";

const RighsectionJoinRoom = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [emoji, setEmoji] = useState(null);
  const [inputName, setInputName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickerRef = useRef(null);
  const codeRefs = useRef([]);

  useEffect(() => {
    API.get("/auth/me", { _skipRefresh: true })
      .then((res) => {
        setUser(res.data);
        setInputName(res.data.username || "");
        if (res.data.avatar_emoji) setEmoji(res.data.avatar_emoji);
      })
      .catch(() => {
        setUser(null);
        console.log("not signed in");
      })
      .finally(() => setAuthChecked(true));
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const codeDigits = [...roomCode].slice(0, 6);

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

    const finalName = user ? inputName.trim() : guestName.trim();
    if (!finalName)
      return toast.error("Enter a display name");

    setLoading(true);
    try {
      // 1. If logged in, patch their profile before joining
      if (user) {
        await API.patch("/auth/avatar", {
          username: finalName,
          avatarEmoji: emoji || null,
        });
      }

      // 2. Join the room
      const payload = { roomCode: code };
      if (!user) payload.guestName = finalName;

      const res = await API.post("/rooms/join", payload);
      const { room, reconnectToken } = res.data;

      // 3. Persist user context for session
      localStorage.setItem(
        "uno_user",
        JSON.stringify({
          userId: user?.user_id || null,
          username: finalName,
          avatarEmoji: emoji || null,
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
      className="relative z-10 w-[90dvw] min-h-[50dvh] lg:w-1/2 lg:h-[80dvh]
      bg-[#333]/20 backdrop-blur-2xl rounded-3xl overflow-hidden
      shadow-[0_8px_32px_rgba(230,0,255,0.37)] flex flex-col justify-center p-6"
    >
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br
        from-transparent to-white/20 pointer-events-none z-0"
      />
      <div className="relative z-10 w-full max-w-sm mx-auto overflow-y-scroll lg:overflow-hidden lg:justify-center lg:items-center">
        {/* Header */}
        <div className="mb-4">
          <h1
            className="text-white text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Join a room
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {authChecked && user
              ? `Customize details and enter room code`
              : "Enter the 6-character room code"}
          </p>
        </div>

        {/* Logged-in user customizer */}
        {authChecked && user && (
          <div className="flex flex-col items-center gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5 mb-4">
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-200 hover:scale-105 relative
                  border border-purple-400/40 hover:border-purple-400/80"
                style={{ background: "rgba(150,80,255,0.15)" }}
              >
                {emoji ? (
                  <span className="text-3xl leading-none">{emoji}</span>
                ) : (
                  <span
                    className="text-lg font-black text-purple-300 leading-none"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {inputName?.[0]?.toUpperCase() || "?"}
                  </span>
                )}

                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border border-purple-400/40 bg-purple-600/60">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              </button>

              {showPicker && (
                <div
                  className="absolute z-50 left-1/2 -translate-x-1/2 mt-3"
                  style={{ top: "100%" }}
                >
                  <div className="p-3 rounded-3xl bg-[#2a104d] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <EmojiPicker
                      theme="dark"
                      skinTonesDisabled
                      searchDisabled
                      height={300}
                      width={250}
                      onEmojiClick={(e) => {
                        setEmoji(e.emoji);
                        setShowPicker(false);
                      }}
                      style={{
                        "--epr-bg-color": "#1a0a3a",
                        "--epr-category-label-bg-color": "#1a0a3a",
                        "--epr-hover-bg-color": "rgba(150,80,255,0.2)",
                        "--epr-border-color": "rgba(150,80,255,0.2)",
                        "--epr-text-color": "rgba(255,255,255,0.7)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                Signed in as
              </span>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  placeholder="Display name in game"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  maxLength={32}
                  className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 outline-none focus:border-purple-400/50"
                />
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="px-3 rounded-xl text-xs font-semibold text-purple-300/50 hover:text-purple-300 transition-colors"
                >
                  Switch
                </button>
              </div>
            </div>
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
        <div className="flex items-center gap-3 mt-4 mb-4">
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
