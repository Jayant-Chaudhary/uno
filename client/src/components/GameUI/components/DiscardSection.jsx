import UnoCard from "../cardGenerator";

export default function DiscardSection({
  topDiscard,
  gameState,
  isMyTurn,
  onDraw,
  onPass,
  selectedCard,
  desktop = false,
}) {
  const COLOR_MAP = {
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#d97706",
  };
  const currentColorHex = COLOR_MAP[gameState?.currentColor] ?? "#6b21a8";

  // ── Desktop: large centred card ────────────────────────────────────────────
  if (desktop) {
    return (
      <div
        className="bg-black/30 backdrop-blur-xl rounded-3xl p-5 border
          border-white/10 flex flex-col items-center justify-center flex-1"
      >
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
          Current Card
        </p>

        {topDiscard ? (
          <UnoCard
            card={topDiscard}
            width={120}
            height={180}
            chooseColor={gameState.currentColor}
          />
        ) : (
          <div
            className="w-[120px] h-[180px] border-2 border-dashed border-white/20
              rounded-xl flex items-center justify-center text-white/20 text-xs"
          >
            Empty
          </div>
        )}
      </div>
    );
  }

  // ── Mobile: compact inline row ─────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <p className="text-xs text-white/50 uppercase tracking-widest">
        Discard Pile
      </p>

      {/* Current colour dot */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ background: currentColorHex }}
        />
        <span className="text-[10px] text-white/40 capitalize">
          {gameState?.currentColor}
        </span>
      </div>

      {topDiscard && (
        <UnoCard
          card={topDiscard}
          width={100}
          height={150}
          chooseColor={gameState.currentColor}
        />
      )}

      {/* Pass button – only when it's your turn and no card is selected */}
      {isMyTurn && !selectedCard && (
        <button
          onClick={onPass}
          className="text-xs px-3 py-1.5 rounded-xl text-white/50
            hover:text-white/80 transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Pass
        </button>
      )}
    </div>
  );
}
