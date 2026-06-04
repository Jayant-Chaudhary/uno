import UnoCard from "../cardGenerator";

export default function HandSection({
  hand = [],
  isMyTurn,
  selectedCard,
  onCardTap,
  isValidPlay,
  page,
  totalPages,
  onPageChange,
  isExpanded = false,
  desktop = false,
  recentNewCardIds = [],
}) {
  const HAND_PER_PAGE = 4;
  const visibleHand = desktop
    ? hand
    : hand.slice(page * HAND_PER_PAGE, (page + 1) * HAND_PER_PAGE);

  // ── Desktop ────────────────────────────────────────────────────────────────
  if (desktop) {
    return (
      <div
        className={`flex-1 rounded-3xl p-4 flex items-center overflow-x-auto scrollbar-none border transition-all duration-500 backdrop-blur-2xl
          ${
            isMyTurn
              ? "bg-green-950/40 border-green-500/50 shadow-[0_-8px_32px_rgba(34,197,94,0.25)]"
              : "bg-[#333]/20 border-purple-400/25 shadow-[0_8px_32px_rgba(230,0,255,0.25)]"
          }`}
      >
        <div className="flex gap-4 min-w-max px-4 items-center h-full">
          {hand.map((card) => {
            const valid = isMyTurn && isValidPlay(card);
            const selected = selectedCard?.id === card.id;
            const isNew = recentNewCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => onCardTap(card)}
                className={`flex-shrink-0 transition-all duration-200 cursor-pointer rounded-2xl border-2
                  ${
                    selected
                      ? "-translate-y-6 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      : "hover:-translate-y-2"
                  }
                  ${!valid && isMyTurn ? "opacity-50 hover:opacity-100" : ""}
                  ${isNew ? "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)] scale-105" : "border-transparent"}`}
              >
                <UnoCard card={card} width={80} height={120} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Mobile ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      {/* Card row */}
      <div
        className={`flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none
          transition-all
          ${isExpanded ? "h-48 flex-wrap" : "h-28"}`}
      >
        {visibleHand.map((card) => {
          const valid = isMyTurn && isValidPlay(card);
          const selected = selectedCard?.id === card.id;
          const isNew = recentNewCardIds.includes(card.id);
          return (
            <div
              key={card.id}
              onClick={() => onCardTap(card)}
              className={`flex-shrink-0 transition-transform cursor-pointer rounded-xl border-2
                ${selected ? "-translate-y-4 shadow-[0_0_15px_white]" : ""}
                ${!valid && isMyTurn ? "opacity-50" : ""}
                ${isNew ? "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)] scale-105" : "border-transparent"}`}
            >
              <UnoCard card={card} width={60} height={90} />
            </div>
          );
        })}

        {hand.length === 0 && (
          <p className="text-xs text-white/30 italic self-center">No cards</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
