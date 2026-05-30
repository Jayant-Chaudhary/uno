
export default function ActionButton({
  label,
  bg,
  onClick,
  disabled,
  desktop = false,
}) {
  if (desktop) {
    return (
      <div
        className="w-72 flex-shrink-0 flex items-center justify-center
          bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-4"
      >
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full h-full rounded-2xl font-black text-2xl uppercase
            tracking-widest transition-all duration-200 border-2 ${bg}`}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {label}
        </button>
      </div>
    );
  }

  // Mobile: full-width button inside the bottom bar
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-xl font-black text-lg tracking-wide uppercase
        transition-all border-2 ${bg}`}
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      {label}
    </button>
  );
}