import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import API from "../../api/AuthApi";
import toast from "react-hot-toast";

const RightSectionRoomCreator = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [emoji, setEmoji] = useState(null);
  const [inputName, setInputName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const pickerRef = useRef(null);

  // ── Fetch current user on mount ────────────────────────────────────────────
  useEffect(() => {
    API.get("/auth/me")
      .then((res) => {
        const u = res.data;
        setUser(u);
        setInputName(u.username || "");
        if (u.avatar_emoji) setEmoji(u.avatar_emoji);
      })
      .catch(() => {
        toast.error("Please sign in first");
        navigate("/auth");
      })
      .finally(() => setFetching(false));
  }, []);

  // ── Close picker on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  // ── Avatar display ─────────────────────────────────────────────────────────
  const initials = user?.username?.[0]?.toUpperCase() ?? "?";

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!inputName.trim()) return toast.error("Please enter a display name");
    setLoading(true);
    try {
      // 1. Save avatar permanently to user profile
      if (emoji) {
        console.log("Submitting emoji:", emoji);
        try {
          await API.patch("/auth/avatar", { avatarEmoji: emoji });
        } catch (err) {
          console.log(err);
        }
      }

      // 2. Create the room
      const res = await API.post("/rooms/create", {
        maxPlayers,
        displayName: inputName.trim(),
        avatarEmoji: emoji || null,
      });

      const room = res.data.room;

      // 3. Persist user context for the session
      localStorage.setItem(
        "uno_user",
        JSON.stringify({
          userId: user.user_id,
          username: inputName.trim(),
          avatarEmoji: emoji || null,
        }),
      );

      toast.success("Room created!");
      navigate(`/lobby/${room.room_code}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div
        className="relative z-10 w-[90dvw] min-h-[50dvh] lg:w-1/2 lg:h-[80dvh]
        bg-[#333]/20 backdrop-blur-2xl rounded-3xl overflow-hidden
        shadow-[0_8px_32px_rgba(230,0,255,0.37)] flex items-center justify-center"
      >
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
    );
  }

  return (
    <div
      className="relative z-10 w-[90dvw] min-h-[50dvh] lg:w-1/2 lg:h-[80dvh]
      bg-[#333]/20 backdrop-blur-2xl rounded-3xl overflow-hidden
      shadow-[0_8px_32px_rgba(230,0,255,0.37)] flex justify-center p-6"
    >
      {/* reflective layer */}
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br
        from-transparent to-white/20 pointer-events-none z-0"
      />

      {/* content */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto
        overflow-y-scroll lg:overflow-hidden flex flex-col justify-center"
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1
              className="text-white text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Create room
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Set up your game and invite friends
            </p>
          </div>

          <form onSubmit={submitHandler} className="flex flex-col gap-5">
            {/* ── Avatar picker ── */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setShowPicker((p) => !p)}
                  className="w-24 h-24 rounded-full flex items-center justify-center
                    transition-all duration-200 hover:scale-105 relative
                    border-2 border-purple-400/30 hover:border-purple-400/60"
                  style={{ background: "rgba(150,80,255,0.15)" }}
                >
                  {emoji ? (
                    <span className="text-5xl leading-none">{emoji}</span>
                  ) : (
                    <span
                      className="text-3xl font-black text-purple-300 leading-none"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {initials}
                    </span>
                  )}

                  {/* edit badge */}
                  <div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                    flex items-center justify-center
                    border border-purple-400/40"
                    style={{ background: "rgba(173, 157, 166, 0.4)" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(200,150,255,0.9)"
                      strokeWidth="2.5"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </button>

                {/* Emoji picker dropdown */}
                {showPicker && (
                  <div
                    className="absolute z-50 left-1/2 -translate-x-1/2 mt-3"
                    style={{ top: "100%" }}
                  >
                    <div className="p-3 sm:p-5 rounded-[35px] bg-[#2a104d]">
                      <EmojiPicker
                        theme="dark"
                        skinTonesDisabled
                        searchDisabled={false}
                        height={window.innerWidth < 640 ? 350 : 450}
                        width={window.innerWidth < 640 ? 260 : 320}
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

              <p className="text-xs text-white/30">
                {emoji ? "Tap to change emoji" : "Tap to pick an emoji avatar"}
              </p>
            </div>

            {/* ── Display name ── */}
            <div className="relative">
              <UserIcon />
              <input
                type="text"
                placeholder="Display name in game"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={32}
                required
                className="auth-field pl-10 text-white outline-none"
              />
            </div>

            {/* ── Max players ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Max players</span>
                <span
                  className="text-sm font-semibold text-white/90"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {maxPlayers}
                </span>
              </div>

              {/* stepper */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMaxPlayers((p) => Math.max(2, p - 1))}
                  disabled={maxPlayers <= 2}
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                    border border-white/10 bg-white/[0.04]
                    text-white/60 hover:text-white hover:border-white/20
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-150"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>

                {/* track */}
                <div className="flex-1 flex gap-1 items-center">
                  {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPlayers(n)}
                      className="flex-1 h-1.5 rounded-full transition-all duration-150"
                      style={{
                        background:
                          n <= maxPlayers
                            ? "rgba(150,80,255,0.7)"
                            : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMaxPlayers((p) => Math.min(20, p + 1))}
                  disabled={maxPlayers >= 20}
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                    border border-white/10 bg-white/[0.04]
                    text-white/60 hover:text-white hover:border-white/20
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-150"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-white/25">
                {maxPlayers <= 4
                  ? `${maxPlayers} players · 7 cards each`
                  : maxPlayers <= 8
                    ? `${maxPlayers} players · 6 cards each`
                    : `${maxPlayers} players · 5 cards each`}
              </p>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-xl
                bg-purple-600/50 hover:bg-purple-600/70
                border border-purple-400/30
                text-white text-sm font-semibold tracking-wide
                shadow-[0_0_20px_rgba(168,85,247,0.3)]
                hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating…" : "Create Room"}
            </button>
          </form>

          {/* back to join */}
          <p className="text-center text-xs text-white/25">
            Want to join instead?{" "}
            <span
              onClick={() => navigate("/join")}
              className="text-purple-300/60 hover:text-purple-300 cursor-pointer transition-colors"
            >
              Join a room
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Icons ────────────────────────────────────────────────────────────────────
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

export default RightSectionRoomCreator;
