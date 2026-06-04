import PlayerAvatar from "./PlayerAvatar";
import PeekTimer from "./PeekTimer";

export default function OpponentCard({
  opp,
  index,
  peek,
  onPeek,
  desktop = false,
  turnNumber,
  isCurrentTurn,
}) {
  const isBeingPeeked = peek?.targetId === opp.id;
  const isLockedOut = peek && peek.targetId !== opp.id;

  const avatarSize = desktop ? 56 : 40;
  const padding = desktop ? "p-4" : "p-3";
  const nameSize = desktop ? "text-sm mt-3" : "text-sm mt-2";
  const cardNumSize = desktop ? "text-2xl" : "text-xl";

  return (
    <button
      onClick={() => !isLockedOut && onPeek(opp.id)}
      disabled={isLockedOut}
      className={`relative ${padding} rounded-2xl flex flex-col items-center border
        transition-all duration-200
        ${
          isCurrentTurn
            ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-2 ring-red-500/30 scale-105"
            : isBeingPeeked
            ? "border-purple-500 bg-purple-500/20 scale-105"
            : "border-purple-400/25 bg-[#333]/20 hover:bg-white/10 shadow-[0_8px_32px_rgba(230,0,255,0.15)]"
        }
        ${isLockedOut ? "opacity-40 cursor-not-allowed grayscale" : ""}`}
    >
      {turnNumber !== null && (
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_2px_8px_rgba(0,0,0,0.4)] border transition-all duration-300"
          style={{
            background: isCurrentTurn
              ? "linear-gradient(135deg, #ef4444, #b91c1c)"
              : "linear-gradient(135deg, #a855f7, #6b21a8)",
            color: "white",
            borderColor: "rgba(255,255,255,0.4)",
            fontFamily: "'Syne', sans-serif",
          }}
          title={`Player Play Order: Turn ${turnNumber}`}
        >
          {turnNumber}
        </div>
      )}

      <PlayerAvatar player={opp} index={index} size={avatarSize} />

      <span
        className={`font-bold text-white truncate w-full text-center ${nameSize}`}
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {opp.name}
      </span>

      {/* Peeking: show card count + timer */}
      {isBeingPeeked ? (
        <div className="text-center mt-2">
          <span className={`font-black text-white ${cardNumSize}`}>
            {opp.cardCount}
          </span>
          <span className="text-xs block text-white/50">
            cards ({peek.secondsLeft}s)
          </span>
          <PeekTimer seconds={peek.secondsLeft} />
        </div>
      ) : (
        /* Not peeking: show lock / tap hint */
        <div className="mt-2 text-xs text-white/40">
          {isLockedOut ? "🔒 Locked" : "Tap to Peek"}
        </div>
      )}

      {/* UNO warning badge */}
      {opp.cardCount === 1 && (
        <span
          className="mt-1 text-[9px] font-black px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(220,50,50,0.4)",
            color: "#fca5a5",
            border: "1px solid rgba(220,50,50,0.5)",
          }}
        >
          UNO!
        </span>
      )}
    </button>
  );
}
