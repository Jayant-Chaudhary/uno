export function OpponentAwayOverlay({ opponentAway, onLeave }) {
  if (!opponentAway) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 
                      flex flex-col items-center gap-5 max-w-xs w-full mx-4 text-center"
      >
        {/* Pulsing dot */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute inline-flex h-12 w-12 rounded-full 
                           bg-yellow-500/20 animate-ping"
          />
          <span
            className="relative inline-flex h-8 w-8 rounded-full bg-yellow-500/40
                           items-center justify-center text-xl"
          >
            ⏳
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-white font-semibold text-lg">
            {opponentAway.disconnectedName} disconnected
          </h2>
          <p className="text-white/40 text-sm">
            Waiting for them to reconnect…
          </p>
          <p className="text-white/25 text-xs mt-2">
            The game is paused until they return.
          </p>
        </div>

        <button
          onClick={onLeave}
          className="w-full mt-2 py-2.5 rounded-xl border border-white/10 
                     text-white/50 text-sm hover:bg-white/5 hover:text-white/80
                     transition-all active:scale-95"
        >
          Leave room
        </button>
      </div>
    </div>
  );
}
