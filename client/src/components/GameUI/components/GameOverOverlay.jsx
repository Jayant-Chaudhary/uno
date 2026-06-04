export default function GameOverOverlay({ winner, isMe, isHost, onPlayAgain }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <div
        className="
          relative
          z-10
          w-full
          max-w-sm
          bg-[#333]/20
          backdrop-blur-2xl
          rounded-3xl
          overflow-hidden
          shadow-[0_8px_32px_rgba(230,0,255,0.37)]
          border border-white/10
          flex
          flex-col
          items-center
          gap-6
          p-8
          text-center
          animate-[scaleUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]
        "
      >
        {/* Reflective layer */}
        <div
          className="
            absolute
            inset-0
            rounded-3xl
            bg-gradient-to-br
            from-transparent
            to-white/10
            pointer-events-none
            z-0
          "
        />

        <div className="relative z-10 flex flex-col items-center gap-4 w-full">
          <p className="text-7xl animate-bounce">{isMe ? "🎉" : "😔"}</p>

          <h1
            className="font-black text-3xl text-white tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {isMe ? "You Won!" : `${winner?.name || "Opponent"} Wins!`}
          </h1>

          <p className="text-white/60 text-xs leading-relaxed max-w-[240px]">
            {isMe 
              ? "Magnificent victory! You outsmarted everyone and cleared your hand first." 
              : "Better luck next match! Keep sharpening your strategy to claim the arena."}
          </p>

          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="
                w-full py-3 mt-2 rounded-xl
                bg-purple-600/50 hover:bg-purple-600/70
                border border-purple-400/30
                text-white text-sm font-semibold tracking-wide
                shadow-[0_0_20px_rgba(168,85,247,0.3)]
                hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]
                transition-all duration-200 hover:scale-[1.02] active:scale-95
                cursor-pointer
              "
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Play Again
            </button>
          ) : (
            <div className="w-full py-3 mt-2 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-white/35 font-medium">
              Waiting for host to restart…
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}