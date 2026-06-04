import OpponentCard from "./OpponentCard";

export default function OpponentGrid({
  opponents,
  peek,
  onPeek,
  page,
  totalPages,
  onPageChange,
  desktop = false,
  isMyTurn,
  players,
  currentTurnId,
}) {
  const OPP_PER_PAGE = desktop ? opponents.length : 6; // desktop shows all
  const visible = desktop
    ? opponents
    : opponents.slice(page * OPP_PER_PAGE, (page + 1) * OPP_PER_PAGE);

  // ── Desktop layout ─────────────────────────────────────────────────────────
  if (desktop) {
    return (
      <div
        className={`flex-1 flex flex-col rounded-3xl p-5 border transition-all duration-500 backdrop-blur-2xl
          ${
            isMyTurn
              ? "bg-green-950/20 border-green-500/50 shadow-[0_8px_32px_rgba(34,197,94,0.3)]"
              : "bg-[#333]/20 border-purple-400/25 shadow-[0_8px_32px_rgba(230,0,255,0.25)]"
          }`}
      >
        <p
          className="text-xs font-bold text-white/40 uppercase tracking-widest
          mb-4 text-center"
        >
          Opponents
        </p>
        <div
          className="flex-1 grid grid-cols-4 gap-4 auto-rows-max
          place-content-center"
        >
          {visible.map((opp, i) => {
            const turnNumber = players ? players.findIndex((p) => p.id === opp.id) + 1 : null;
            return (
              <OpponentCard
                key={opp.id}
                opp={opp}
                index={i}
                peek={peek}
                onPeek={onPeek}
                turnNumber={turnNumber}
                isCurrentTurn={opp.id === currentTurnId}
                desktop
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((opp, i) => {
          const turnNumber = players ? players.findIndex((p) => p.id === opp.id) + 1 : null;
          return (
            <OpponentCard
              key={opp.id}
              opp={opp}
              index={page * OPP_PER_PAGE + i}
              peek={peek}
              onPeek={onPeek}
              turnNumber={turnNumber}
              isCurrentTurn={opp.id === currentTurnId}
            />
          );
        })}
      </div>

      {/* Pagination (mobile only; desktop shows all) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-1">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="w-6 h-6 rounded-lg text-white/40 disabled:opacity-20
              flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            ‹
          </button>
          <span className="text-xs text-white/30">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="w-6 h-6 rounded-lg text-white/40 disabled:opacity-20
              flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
