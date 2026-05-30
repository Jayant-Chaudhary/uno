
export default function PeekTimer({ seconds, total = 20 }) {
  const pct = (seconds / total) * 100;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.08)" }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36">
          {/* track */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          {/* progress */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="rgba(200,150,255,0.8)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          {/* label */}
          <text
            x="18"
            y="22"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {seconds}
          </text>
        </svg>
      </div>
    </div>
  );
}
