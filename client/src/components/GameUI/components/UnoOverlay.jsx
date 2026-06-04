import React, { useEffect } from "react";

export default function UnoOverlay({ playerName, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center
        bg-black/85 backdrop-blur-xl overflow-hidden"
      style={{
        fontFamily: "'Fredoka', 'Syne', sans-serif",
      }}
    >
      {/* Floating background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => {
          const delay = Math.random() * 2;
          const left = Math.random() * 100;
          const duration = 2 + Math.random() * 2;
          const size = 12 + Math.random() * 24;
          const rotate = Math.random() * 360;
          const colors = ["#b91c1c", "#1d4ed8", "#15803d", "#d97706", "#c4b5fd"];
          const randomColor = colors[i % colors.length];

          return (
            <div
              key={i}
              className="absolute rounded-lg opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              style={{
                left: `${left}%`,
                top: `-10%`,
                width: `${size}px`,
                height: `${size * 1.5}px`,
                backgroundColor: randomColor,
                border: "2px solid white",
                transform: `rotate(${rotate}deg)`,
                animation: `floatDown ${duration}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Main visual wrapper */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md animate-[scaleUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        {/* Pulsing neon glow card */}
        <div className="absolute -inset-10 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-[50%] blur-3xl opacity-40 animate-pulse pointer-events-none" />

        {/* Bouncing rotating giant text */}
        <h1
          className="text-8xl md:text-9xl font-black italic tracking-widest leading-none select-none text-white animate-[bounceRotate_1.2s_ease-in-out_infinite]"
          style={{
            textShadow: `
              0 0 10px rgba(255,255,255,0.8),
              0 0 20px rgba(139,92,246,0.8),
              0 0 40px rgba(236,72,153,0.8),
              8px 8px 0px #000
            `,
            transform: "skewX(-10deg)",
          }}
        >
          UNO!
        </h1>

        {/* Player call details */}
        <div
          className="mt-8 px-8 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(150,80,255,0.25)] flex flex-col items-center gap-1 animate-[fadeIn_0.5s_ease-out_0.2s_both]"
        >
          <span className="text-[10px] font-bold tracking-[3px] uppercase text-purple-300">
            Player Callout
          </span>
          <span
            className="text-2xl md:text-3xl font-black text-white"
            style={{
              textShadow: "0 0 10px rgba(255,255,255,0.3)",
            }}
          >
            {playerName}
          </span>
          <span className="text-xs text-white/50 font-medium">
            called UNO! (1 card remaining)
          </span>
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes floatDown {
          0% {
            top: -15%;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            top: 115%;
            transform: translateY(200px) rotate(360deg);
          }
        }
        @keyframes scaleUp {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bounceRotate {
          0%, 100% {
            transform: translateY(0) rotate(-5deg) scale(1) skewX(-10deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg) scale(1.05) skewX(-10deg);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
