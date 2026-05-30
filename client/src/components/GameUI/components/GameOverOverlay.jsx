
export default function GameOverOverlay({ winner, isMe, isHost, onPlayAgain }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: "rgba(5,0,15,0.9)", backdropFilter: "blur(12px)" }}
    >
      <p className="text-6xl">{isMe ? "🎉" : "😔"}</p>

      <p
        className="font-black text-4xl text-white tracking-tight"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {isMe ? "You won!" : `${winner.name} wins!`}
      </p>

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="px-8 py-3 rounded-2xl font-black text-sm tracking-wide
            transition-all duration-200 hover:scale-105"
          style={{
            fontFamily: "'Syne', sans-serif",
            background: "rgba(130,60,230,0.45)",
            border: "1px solid rgba(170,100,255,0.4)",
            color: "rgba(220,180,255,0.95)",
            boxShadow: "0 0 30px rgba(130,60,230,0.3)",
          }}
        >
          Play Again
        </button>
      ) : (
        <p className="text-sm text-white/30">Waiting for host to restart…</p>
      )}
    </div>
  );
}