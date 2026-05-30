import { WILD_COLORS } from "../components/constants/gameConstants";

export default function WildColorPicker({ onPick, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(5,0,15,0.85)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        <p
          className="text-white font-black text-xl tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Choose a color
        </p>

        <div className="grid grid-cols-2 gap-4">
          {WILD_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => onPick(c.key)}
              className="w-24 h-24 rounded-2xl font-black text-white text-sm tracking-wide
                transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: c.bg,
                boxShadow: `0 0 24px ${c.bg}66`,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
