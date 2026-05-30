import PlayerAvatar from "./PlayerAvatar";
import PeekTimer from "./PeekTimer";

export default function OpponentCard({
  opp,
  index,
  peek,
  onPeek,
  desktop = false,
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
      className={`${padding} rounded-2xl flex flex-col items-center border
        transition-all duration-200
        ${
          isBeingPeeked
            ? "border-purple-500 bg-purple-500/20 scale-105"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }
        ${isLockedOut ? "opacity-40 cursor-not-allowed grayscale" : ""}`}
    >
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
