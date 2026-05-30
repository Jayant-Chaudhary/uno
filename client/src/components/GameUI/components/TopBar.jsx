import React from "react";
import PlayerAvatar from "./PlayerAvatar";

const TopBar = ({
  me,
  isMyTurn,
  currentPlayerName,
  latestGameEvent,
  onOpenSettings,
  desktop=false,
}) => {
  if (desktop) {
    return (
      <div
        className={`md:flex hidden  items-center justify-between px-6 py-3 rounded-2xl backdrop-blur-xl border transition-colors duration-500 ${isMyTurn ? "bg-green-950/40 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-black/40 border-white/10"}`}
      >
        {/* Left: Avatar (Opens Settings) */}
        <button
          onClick={() => setShowSettings(true)}
          className="relative border border-white/20 rounded-full p-0.5 hover:scale-105 transition-transform cursor-pointer"
        >
          <PlayerAvatar player={me} index={0} size={40} />
        </button>

        {/* Middle: Quick Message Viewer */}
        <div className="flex-1 flex justify-center">
          <div className="px-8 py-2 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center min-w-[300px]">
            <span className="text-sm font-bold text-white/70 uppercase tracking-widest text-center">
              {latestGameEvent}
            </span>
          </div>
        </div>

        {/* Right: Turn Indicator */}
        <div
          className={`px-5 py-2 rounded-xl font-black text-sm tracking-widest uppercase border ${isMyTurn ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-white/10 text-white/60 border-white/10"}`}
        >
          {isMyTurn ? "YOUR TURN" : `${currentPlayerName}'s Turn`}
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mb-3">
          <div
            className={`px-3 py-1 rounded-full font-black text-sm tracking-wide ${isMyTurn ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-white/10 text-white/60"}`}
          >
            {isMyTurn ? "YOUR TURN" : `${currentPlayerName}'s Turn`}
          </div>
          <div className="flex items-center gap-4">
            {/* Message Button */}
            <button
              onClick={() => toast("Messages coming soon!")}
              className="text-white/70 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </button>
            {/* Avatar / Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="relative border border-white/20 rounded-full p-0.5"
            >
              <PlayerAvatar player={me} index={0} size={32} />
            </button>
          </div>
        </div>

        <div
          className={`md:flex hidden  items-center justify-between px-6 py-3 rounded-2xl backdrop-blur-xl border transition-colors duration-500 ${isMyTurn ? "bg-green-950/40 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-black/40 border-white/10"}`}
        >
          {/* Left: Avatar (Opens Settings) */}
          <button
            onClick={() => setShowSettings(true)}
            className="relative border border-white/20 rounded-full p-0.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <PlayerAvatar player={me} index={0} size={40} />
          </button>

          {/* Middle: Quick Message Viewer */}
          <div className="flex-1 flex justify-center">
            <div className="px-8 py-2 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center min-w-[300px]">
              <span className="text-sm font-bold text-white/70 uppercase tracking-widest text-center">
                {latestGameEvent}
              </span>
            </div>
          </div>

          {/* Right: Turn Indicator */}
          <div
            className={`px-5 py-2 rounded-xl font-black text-sm tracking-widest uppercase border ${isMyTurn ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-white/10 text-white/60 border-white/10"}`}
          >
            {isMyTurn ? "YOUR TURN" : `${currentPlayerName}'s Turn`}
          </div>
        </div>
      </div>
    );
  }
};

export default TopBar;
